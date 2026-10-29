import "server-only";
import crypto from "node:crypto";
import type Stripe from "stripe";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { appendOrderList, emailKey, getOrder, markPaid, setOrderStatus } from "@/lib/data/orders";
import { decrementStock } from "@/lib/data/catalog";
import { recordRedemption } from "@/lib/data/discounts";
import { recordRefund, recordSale } from "@/lib/data/analytics";
import { getSubscription, upsertFromStripe } from "@/lib/data/subscriptions";
import { ensureStripeProduct } from "@/lib/stripe/products";
import { findSubscriptionPrice } from "@/lib/stripe/sync";
import { calculateRates } from "@/lib/shipping";
import { addressBlock, isSellableCountry } from "@/lib/countries";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { formatPrice } from "@/lib/utils";
import { getPreorderSettings } from "@/lib/data/settings";
import type { Currency } from "@/types";
import type { OrderRecord } from "@/types/records";

const SYSTEM = "system";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

/**
 * payment_intent.succeeded. Runs its side effects once per order even though
 * Stripe may deliver the event more than once.
 */
export async function handlePaymentSucceeded(stripe: Stripe, pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;
  const order = await getOrder(orderId);
  if (!order) {
    console.error("[orders] paid intent has no order", orderId);
    return;
  }
  // Last gate before fulfilment: the order's shipping address, and the one
  // Stripe holds, must be in a country we sell to. Otherwise refund in full
  // and cancel; nothing is decremented, recorded or emailed.
  const stripeCountry = pi.shipping?.address?.country;
  const block = addressBlock(order.shippingAddress) ?? (stripeCountry && !isSellableCountry(stripeCountry) ? "country" : null);
  if (block) {
    if (order.status !== "pending") return;
    try {
      await setOrderStatus(orderId, "cancelled", { cancelReason: `not_sellable_${block}` }, ["pending"]);
    } catch (err) {
      if ((err as Error).name === "ConditionalCheckFailedException") return;
      throw err;
    }
    await stripe.refunds.create(
      { payment_intent: pi.id, reason: "requested_by_customer", metadata: { by: SYSTEM, orderId, why: `not_sellable_${block}` } },
      { idempotencyKey: `not-sellable-${orderId}` },
    );
    await appendOrderList(orderId, "notes", {
      at: new Date().toISOString(),
      by: SYSTEM,
      text: `Shipping address is outside the countries we sell to (${block}). Payment refunded in full automatically. Do not ship.`,
    });
    return;
  }
  const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
  const firstTime = await markPaid(orderId, pi.id, pi.amount, customerId);
  if (!firstTime) {
    if (order.status === "pending") {
      // Amount or intent mismatch: never fulfil, flag for staff.
      await appendOrderList(orderId, "notes", { at: new Date().toISOString(), by: SYSTEM, text: "Payment did not match the order total. Check Stripe before shipping." });
    }
    return;
  }

  const failedStock = await decrementStock(order.items.map((l) => ({ sku: l.sku, qty: l.qty })));
  if (failedStock.length) {
    await appendOrderList(orderId, "notes", { at: new Date().toISOString(), by: SYSTEM, text: `Not enough stock recorded for ${failedStock.join(", ")}.` });
  }
  if (order.discountCode) {
    const within = await recordRedemption(order.discountCode, order.email, orderId);
    if (!within) {
      await appendOrderList(orderId, "notes", { at: new Date().toISOString(), by: SYSTEM, text: `Discount ${order.discountCode} was over its use limit when paid.` });
    }
  }
  await recordSale(
    new Date().toISOString(),
    order.currency,
    order.totalCents,
    order.items.reduce((n, l) => n + l.qty, 0),
    order.preorder === "1",
  );

  if (pi.metadata?.taxCalculationId) {
    await stripe.tax.transactions
      .createFromCalculation({ calculation: pi.metadata.taxCalculationId, reference: orderId }, { idempotencyKey: `tax-${orderId}` })
      .catch((err) => console.error("[orders] tax transaction failed", (err as Error).name));
  }

  await startSubscriptions(stripe, order, pi);

  const preorder = await getPreorderSettings();
  const money = (c: number) => formatPrice(c, order.currency);
  await sendEmailSafe(
    order.email,
    emailTemplates.orderConfirmation({
      name: firstName(order.customerName),
      orderId,
      lines: order.items.map((l) => ({ name: l.name, variantLabel: l.variantLabel, qty: l.qty, total: money(l.lineTotalCents) })),
      subtotal: money(order.subtotalCents),
      discount: order.discountCents ? money(order.discountCents) : undefined,
      shipping: order.shippingCents === 0 ? "Free" : money(order.shippingCents),
      tax: order.taxCents ? money(order.taxCents) : undefined,
      total: money(order.totalCents),
      preorderNote: order.preorder === "1" ? `Pre-order items: ${preorder.shipNote}.` : undefined,
    }),
    "order confirmation",
  );
}

/**
 * Subscription lines: the first period was charged in the checkout payment,
 * so each Stripe subscription starts with its first renewal one cycle later,
 * charged to the saved card. Renewals include standard shipping for that
 * item to the address given at checkout.
 */
async function startSubscriptions(stripe: Stripe, order: OrderRecord, pi: Stripe.PaymentIntent) {
  const subLines = order.items.filter((l) => l.subscriptionCycleDays);
  if (!subLines.length) return;
  const customer = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
  const paymentMethod = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
  if (!customer || !paymentMethod) {
    await appendOrderList(order.orderId, "notes", { at: new Date().toISOString(), by: SYSTEM, text: "Subscription could not start: no saved payment method." });
    return;
  }
  const currency = order.currency.toLowerCase();
  for (const [i, line] of subLines.entries()) {
    const cycle = line.subscriptionCycleDays!;
    const product = await ensureStripeProduct(stripe, line.sku, line.name);
    const unit = Math.round(line.unitPriceCents * (1 - line.discountPct / 100));
    const shipping = calculateRates({
      items: [{ sku: line.sku, qty: line.qty, unitPriceCents: unit }],
      destinationCountry: order.shippingAddress.country,
      destinationPostal: order.shippingAddress.postalCode,
      currency: order.currency,
      merchandiseCents: unit * line.qty,
    }).find((r) => r.id === "standard");
    // The synced catalog Price when it matches what was sold; otherwise an ad-hoc price for this subscription.
    const synced = await findSubscriptionPrice(stripe, line.sku, order.currency, cycle, unit);
    const items: Stripe.SubscriptionCreateParams.Item[] = [
      synced
        ? { price: synced.id, quantity: line.qty }
        : { price_data: { currency, product: product.id, unit_amount: unit, recurring: { interval: "day", interval_count: cycle } }, quantity: line.qty },
    ];
    if (shipping && shipping.amountCents > 0) {
      const shipProduct = await ensureStripeProduct(stripe, "SHIPPING", "Shipping");
      items.push({ price_data: { currency, product: shipProduct.id, unit_amount: shipping.amountCents, recurring: { interval: "day", interval_count: cycle } }, quantity: 1 });
    }
    const sub = await stripe.subscriptions.create(
      {
        customer,
        default_payment_method: paymentMethod,
        items,
        trial_end: Math.floor(Date.now() / 1000) + cycle * 86400,
        trial_settings: { end_behavior: { missing_payment_method: "pause" } },
        off_session: true,
        metadata: {
          orderId: order.orderId,
          sku: line.sku,
          variantId: line.variantId,
          productName: `${line.name} (${line.variantLabel})`,
          cycleDays: String(cycle),
          email: order.email,
          ...(order.userId ? { userId: order.userId } : {}),
        },
      },
      { idempotencyKey: `sub-${order.orderId}-${i}` },
    );
    await upsertFromStripe(sub);
  }
}

/**
 * A paid renewal invoice becomes a new order for the warehouse to ship.
 * The order id is derived from the invoice id, so retries never duplicate it.
 */
export async function handleRenewalPaid(stripe: Stripe, invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle" || typeof invoice.subscription !== "string") return;
  const rec = await getSubscription(invoice.subscription);
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  const record = rec ?? (await upsertFromStripe(sub));
  const original = record.orderId ? await getOrder(record.orderId) : null;
  const customer = typeof invoice.customer === "string" ? await stripe.customers.retrieve(invoice.customer) : null;
  const ship = customer && !("deleted" in customer && customer.deleted) ? (customer as Stripe.Customer).shipping : null;
  const address = ship?.address
    ? {
        name: ship.name ?? original?.customerName ?? "",
        line1: ship.address.line1 ?? "",
        line2: ship.address.line2 ?? undefined,
        city: ship.address.city ?? "",
        region: ship.address.state ?? "",
        postalCode: ship.address.postal_code ?? "",
        country: ship.address.country ?? "",
        phone: ship.phone ?? undefined,
      }
    : original?.shippingAddress;
  if (!address) {
    console.error("[orders] renewal without address", invoice.id);
    return;
  }
  const now = new Date().toISOString();
  const currency = invoice.currency.toUpperCase() as Currency;
  const productLine = invoice.lines.data.find((l) => l.price?.product !== "ip6_shipping");
  const qty = productLine?.quantity ?? 1;
  const shippingCents = invoice.lines.data.filter((l) => l.price?.product === "ip6_shipping").reduce((s, l) => s + l.amount, 0);
  const order: OrderRecord = {
    orderId: `IP6-R${crypto.createHash("sha256").update(invoice.id).digest("hex").slice(0, 10).toUpperCase()}`,
    status: "paid",
    createdAt: now,
    updatedAt: now,
    paidAt: now,
    email: record.email,
    emailKey: emailKey(record.email),
    ...(record.userId ? { userId: record.userId } : {}),
    customerName: address.name,
    ...(address.phone ? { phone: address.phone } : {}),
    shippingAddress: address,
    items: [
      {
        sku: record.sku,
        variantId: record.variantId,
        name: record.productName,
        variantLabel: `Subscription renewal, every ${record.cycleDays} days`,
        qty,
        unitPriceCents: productLine?.price?.unit_amount ?? record.priceCents,
        discountPct: 0,
        lineTotalCents: productLine?.amount ?? record.priceCents * qty,
        preorder: false,
        subscriptionCycleDays: record.cycleDays,
      },
    ],
    currency,
    subtotalCents: productLine?.amount ?? 0,
    discountCents: 0,
    shippingRateId: "standard",
    shippingLabel: "Standard (subscription)",
    shippingCents,
    taxCents: invoice.tax ?? 0,
    totalCents: invoice.amount_paid,
    stripePaymentIntentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id ?? "",
    stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : undefined,
    refundedCents: 0,
    refunds: [],
    notes: [
      { at: now, by: SYSTEM, text: `Renewal of subscription ${record.subscriptionId}` + (record.orderId ? ` (first order ${record.orderId})` : "") },
      ...(addressBlock(address)
        ? [{ at: now, by: SYSTEM, text: `Renewal address is outside the countries we sell to (${addressBlock(address)}). Do not ship: contact the customer, then refund or update the address.` }]
        : []),
    ],
  };
  try {
    await docClient.send(new PutCommand({ TableName: TABLES.Orders, Item: order, ConditionExpression: "attribute_not_exists(orderId)" }));
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return;
    throw err;
  }
  await decrementStock([{ sku: record.sku, qty }]);
  await recordSale(now, currency, invoice.amount_paid, qty, false);
  await upsertFromStripe(sub);
  await sendEmailSafe(
    record.email,
    emailTemplates.subscriptionChargeSuccess(firstName(address.name), record.productName, formatPrice(invoice.amount_paid, currency)),
    "renewal receipt",
  );
}

export async function handleRenewalUpcoming(invoice: Stripe.Invoice) {
  if (typeof invoice.subscription !== "string") return;
  const rec = await getSubscription(invoice.subscription);
  if (!rec?.email) return;
  const when = invoice.next_payment_attempt ?? invoice.period_end;
  const date = new Date(when * 1000).toLocaleDateString("en-US", { dateStyle: "long" });
  await sendEmailSafe(
    rec.email,
    emailTemplates.subscriptionRenewalReminder("there", rec.productName, date, formatPrice(invoice.amount_due, invoice.currency.toUpperCase() as Currency)),
    "renewal reminder",
  );
}

export async function handleRenewalFailed(invoice: Stripe.Invoice) {
  if (typeof invoice.subscription !== "string") return;
  const rec = await getSubscription(invoice.subscription);
  if (!rec?.email) return;
  await sendEmailSafe(rec.email, emailTemplates.subscriptionChargeFailed("there", rec.productName), "renewal failed");
}

/** charge.refunded: Stripe's running total is authoritative and idempotent. */
export async function handleChargeRefunded(stripe: Stripe, charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  // Charge metadata is not guaranteed to mirror the PaymentIntent, so read the intent.
  const pi = await stripe.paymentIntents.retrieve(piId);
  const orderId = pi.metadata?.orderId;
  const order = orderId ? await getOrder(orderId) : null;
  if (!order || order.stripePaymentIntentId !== piId) return;
  // Refunds made in the admin portal carry metadata.by and are already on the
  // order and in the stats. Ones made directly in Stripe are added here, once
  // each (a marker row makes retried webhooks a no-op).
  const refunds = await stripe.refunds.list({ payment_intent: piId, limit: 100 });
  for (const r of refunds.data) {
    if (r.status === "failed" || r.status === "canceled" || r.metadata?.by) continue;
    if (order.refunds?.some((x) => x.refundId === r.id)) continue;
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.Settings,
          Item: { key: `refund#${r.id}`, orderId: order.orderId, at: new Date().toISOString() },
          ConditionExpression: "attribute_not_exists(#k)",
          ExpressionAttributeNames: { "#k": "key" },
        }),
      );
    } catch (err) {
      if ((err as Error).name === "ConditionalCheckFailedException") continue;
      throw err;
    }
    await appendOrderList(order.orderId, "refunds", {
      refundId: r.id,
      amountCents: r.amount,
      reason: "Refunded in Stripe",
      createdAt: new Date(r.created * 1000).toISOString(),
      createdBy: "stripe",
    });
    await recordRefund(new Date().toISOString(), order.currency, r.amount);
  }
  const total = Math.max(charge.amount_refunded, order.refundedCents ?? 0);
  const latest = await getOrder(order.orderId);
  const status = latest?.status === "cancelled" ? "cancelled" : total >= charge.amount ? "refunded" : "partially_refunded";
  await setOrderStatus(order.orderId, status, { refundedCents: total });
}

export async function handleDispute(dispute: Stripe.Dispute, stripe: Stripe) {
  const charge = typeof dispute.charge === "string" ? await stripe.charges.retrieve(dispute.charge) : dispute.charge;
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const pi = await stripe.paymentIntents.retrieve(piId);
  if (!pi.metadata?.orderId) return;
  await appendOrderList(pi.metadata.orderId, "notes", {
    at: new Date().toISOString(),
    by: SYSTEM,
    text: `Payment disputed (${dispute.reason}). Respond in Stripe before ${dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toDateString() : "the deadline"}.`,
  });
}

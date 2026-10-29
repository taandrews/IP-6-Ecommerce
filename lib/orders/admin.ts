import "server-only";
import type Stripe from "stripe";
import { addRefund, appendOrderList, getOrder, OPEN_STATUSES, setOrderStatus } from "@/lib/data/orders";
import { restock } from "@/lib/data/catalog";
import { recordRefund } from "@/lib/data/analytics";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { formatPrice } from "@/lib/utils";
import { HttpError } from "@/lib/admin/guard";
import type { OrderRecord } from "@/types/records";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

async function load(orderId: string): Promise<OrderRecord> {
  const o = await getOrder(orderId);
  if (!o) throw new HttpError(404, "not_found");
  return o;
}

/** Only http(s) tracking links are stored; anything else is dropped. */
export function safeTrackingUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function markProcessing(orderId: string) {
  await load(orderId);
  await setOrderStatus(orderId, "processing", {}, ["paid"]).catch(() => {
    throw new HttpError(409, "wrong_status");
  });
}

export async function fulfil(orderId: string, f: { carrier: string; trackingNumber: string; trackingUrl?: string }, actorEmail: string, notify: boolean) {
  const o = await load(orderId);
  if (!OPEN_STATUSES.includes(o.status)) throw new HttpError(409, "wrong_status");
  const fulfillment = {
    carrier: f.carrier,
    trackingNumber: f.trackingNumber,
    ...(safeTrackingUrl(f.trackingUrl) ? { trackingUrl: safeTrackingUrl(f.trackingUrl) } : {}),
    shippedAt: new Date().toISOString(),
    shippedBy: actorEmail,
  };
  await setOrderStatus(orderId, "shipped", { fulfillment }, OPEN_STATUSES).catch(() => {
    throw new HttpError(409, "wrong_status");
  });
  if (notify && !o.anonymizedAt) {
    await sendEmailSafe(
      o.email,
      emailTemplates.shippingNotification(firstName(o.customerName), o.orderId, fulfillment.carrier, fulfillment.trackingNumber, fulfillment.trackingUrl),
      "shipping notification",
    );
  }
}

export async function markDelivered(orderId: string) {
  await load(orderId);
  await setOrderStatus(orderId, "delivered", { deliveredAt: new Date().toISOString() }, ["shipped"]).catch(() => {
    throw new HttpError(409, "wrong_status");
  });
}

export async function addNote(orderId: string, text: string, actorEmail: string) {
  await load(orderId);
  await appendOrderList(orderId, "notes", { at: new Date().toISOString(), by: actorEmail, text });
}

/**
 * Refunds through Stripe. The idempotency key covers double-clicks; the
 * order totals are updated by the charge.refunded webhook, and the refund is
 * also recorded on the order immediately for the staff view.
 */
export async function refund(
  stripe: Stripe,
  orderId: string,
  opts: { amountCents?: number; reason?: string; restockItems: boolean; requestKey: string },
  actorEmail: string,
) {
  const o = await load(orderId);
  if (!["paid", "processing", "shipped", "delivered", "partially_refunded"].includes(o.status)) throw new HttpError(409, "wrong_status");
  const remaining = o.totalCents - (o.refundedCents ?? 0);
  const amount = opts.amountCents ?? remaining;
  if (!Number.isInteger(amount) || amount <= 0 || amount > remaining) throw new HttpError(400, "bad_amount");
  const r = await stripe.refunds.create(
    {
      payment_intent: o.stripePaymentIntentId,
      amount,
      reason: "requested_by_customer",
      metadata: { orderId, by: actorEmail, ...(opts.reason ? { note: opts.reason.slice(0, 200) } : {}) },
    },
    { idempotencyKey: `refund-${orderId}-${opts.requestKey}` },
  );
  const total = await addRefund(
    orderId,
    { refundId: r.id, amountCents: amount, reason: opts.reason, createdAt: new Date().toISOString(), createdBy: actorEmail },
    amount,
    o.totalCents,
  );
  // The charge.refunded webhook sees no new amount for this refund, so count it here.
  await recordRefund(new Date().toISOString(), o.currency, amount);
  if (opts.restockItems && total >= o.totalCents) await restock(o.items.map((l) => ({ sku: l.sku, qty: l.qty })));
  if (!o.anonymizedAt) {
    await sendEmailSafe(o.email, emailTemplates.refundIssued(firstName(o.customerName), orderId, formatPrice(amount, o.currency)), "refund email");
  }
  return { refundId: r.id, amountCents: amount };
}

/** Cancels an order that hasn't shipped: full refund, stock returned, customer emailed. */
export async function cancel(stripe: Stripe, orderId: string, reason: string, actorEmail: string, requestKey: string) {
  const o = await load(orderId);
  if (!OPEN_STATUSES.includes(o.status)) throw new HttpError(409, "wrong_status");
  await refund(stripe, orderId, { reason, restockItems: false, requestKey }, actorEmail);
  await restock(o.items.map((l) => ({ sku: l.sku, qty: l.qty })));
  await setOrderStatus(orderId, "cancelled", {});
  await addNote(orderId, `Cancelled: ${reason}`, actorEmail);
  if (!o.anonymizedAt) await sendEmailSafe(o.email, emailTemplates.orderCancelled(firstName(o.customerName), orderId), "cancel email");
}

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { CheckoutInputSchema } from "@/lib/checkout/schema";
import { buildQuote } from "@/lib/checkout/build";
import { createPendingOrder, emailKey, getOrder, setOrderStatus } from "@/lib/data/orders";
import { getSessionUser } from "@/lib/auth/session";
import { getStripe, StripeConfigurationError } from "@/lib/stripe/server";
import { getPreorderSettingsFresh } from "@/lib/data/settings";
import { holdDiscount, releaseDiscountHold } from "@/lib/data/discounts";
import { DISCOUNT_MESSAGES } from "@/lib/pricing/discount";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newOrderId() {
  // 10 random base32 characters: unguessable enough to be shown to customers.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(10);
  return `IP6-${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`;
}

/**
 * Creates the Stripe PaymentIntent for a checkout. The amount comes only
 * from the server-side quote. The full order (items, address) is stored in
 * DynamoDB as "pending"; Stripe receives the order id, not the cart.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "checkout", 10)) ?? (await limitByIp(req, "checkout-hour", 60, 3600));
  if (limited) return limited;
  const parsed = CheckoutInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  const input = parsed.data;
  let held: { code: string; orderId: string } | null = null;

  try {
    const built = await buildQuote(input);
    if (!built.quote) return NextResponse.json({ error: built.error, discountMessage: built.discountMessage, blocked: built.blocked }, { status: 422 });
    const q = built.quote;
    const user = await getSessionUser();
    const preorder = await getPreorderSettingsFresh();
    const stripe = await getStripe();
    const orderId = newOrderId();
    if (q.discountCode) {
      // An earlier unpaid checkout by this person with the same code is cancelled, so the code is only used once.
      const cancelEarlier = async (earlierId: string) => {
        const earlier = await getOrder(earlierId);
        if (!earlier || earlier.status !== "pending" || emailKey(earlier.email) !== emailKey(input.email)) return;
        await stripe.paymentIntents.cancel(earlier.stripePaymentIntentId, { cancellation_reason: "abandoned" });
        await setOrderStatus(earlierId, "cancelled", { cancelReason: "replaced_by_new_checkout" }, ["pending"]);
      };
      if (!(await holdDiscount(q.discountCode, input.email, orderId, cancelEarlier))) {
        return NextResponse.json({ error: DISCOUNT_MESSAGES.used_up, discountMessage: DISCOUNT_MESSAGES.used_up }, { status: 422 });
      }
      held = { code: q.discountCode, orderId };
    }

    // Subscriptions need a Stripe customer and a saved payment method so the
    // renewals can be charged; one-time orders do not create a customer.
    let customerId: string | undefined;
    if (q.hasSubscription) {
      const customer = await stripe.customers.create(
        {
          email: input.email,
          name: input.address.name,
          phone: input.address.phone,
          shipping: {
            name: input.address.name,
            phone: input.address.phone,
            address: {
              line1: input.address.line1,
              line2: input.address.line2,
              city: input.address.city,
              state: input.address.region || undefined,
              postal_code: input.address.postalCode,
              country: input.address.country,
            },
          },
          metadata: { ...(user ? { userId: user.sub } : {}) },
        },
        { idempotencyKey: `cust-${orderId}` },
      );
      customerId = customer.id;
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: q.totalCents,
        currency: q.currency.toLowerCase(),
        receipt_email: input.email,
        description: `IP6 Original order ${orderId}`,
        automatic_payment_methods: { enabled: true },
        ...(customerId ? { customer: customerId, setup_future_usage: "off_session" as const } : {}),
        shipping: {
          name: input.address.name,
          phone: input.address.phone,
          address: {
            line1: input.address.line1,
            line2: input.address.line2,
            city: input.address.city,
            state: input.address.region || undefined,
            postal_code: input.address.postalCode,
            country: input.address.country,
          },
        },
        metadata: {
          orderId,
          ...(built.taxCalculationId ? { taxCalculationId: built.taxCalculationId } : {}),
        },
      },
      { idempotencyKey: `pi-${orderId}` },
    );

    const now = new Date().toISOString();
    await createPendingOrder({
      orderId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      email: input.email,
      emailKey: emailKey(input.email),
      ...(user ? { userId: user.sub } : {}),
      customerName: input.address.name,
      ...(input.address.phone ? { phone: input.address.phone } : {}),
      shippingAddress: input.address,
      items: q.lines,
      currency: q.currency,
      subtotalCents: q.subtotalCents,
      ...(q.discountCode ? { discountCode: q.discountCode } : {}),
      discountCents: q.discountCents,
      shippingRateId: q.shipping.id,
      shippingLabel: `${q.shipping.label} · ${q.shipping.carrier}`,
      shippingCents: q.shipping.amountCents,
      taxCents: q.taxCents,
      totalCents: q.totalCents,
      ...(q.hasPreorder ? { preorder: "1" as const } : {}),
      stripePaymentIntentId: intent.id,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      refundedCents: 0,
      refunds: [],
      notes: [],
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderId,
      quote: q,
      preorderShipNote: q.hasPreorder ? preorder.shipNote : undefined,
    });
  } catch (err) {
    console.error("[checkout] intent failed", (err as Error).name);
    if (held) await releaseDiscountHold(held.code, held.orderId).catch(() => undefined);
    if (err instanceof StripeConfigurationError) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "We couldn't start payment. Please try again." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { CheckoutInputSchema } from "@/lib/checkout/schema";
import { buildQuote } from "@/lib/checkout/build";
import { applyShipping, createCheckoutSession, sessionAmounts } from "@/lib/checkout/session";
import { createPendingOrder, emailKey, getOrder, setOrderStatus } from "@/lib/data/orders";
import { getSessionUser } from "@/lib/auth/session";
import { getStripe, StripeConfigurationError } from "@/lib/stripe/server";
import { holdDiscount, releaseDiscountHold } from "@/lib/data/discounts";
import { DISCOUNT_MESSAGES } from "@/lib/pricing/discount";
import { limitByIp } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/site-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newOrderId() {
  // 10 random base32 characters: unguessable enough to be shown to customers.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(10);
  return `IP6-${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`;
}

/**
 * Starts payment: prices the checkout on the server, creates a Stripe
 * Checkout Session from that quote, and stores the full order (items,
 * address) in DynamoDB as "pending". Stripe receives the order id; the
 * browser receives only the session's client secret.
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
    const stripe = await getStripe();
    const orderId = newOrderId();
    if (q.discountCode) {
      // An earlier unpaid checkout by this person with the same code is closed, so the code is only used once.
      const cancelEarlier = async (earlierId: string) => {
        const earlier = await getOrder(earlierId);
        if (!earlier || earlier.status !== "pending" || emailKey(earlier.email) !== emailKey(input.email)) return;
        if (earlier.stripeCheckoutSessionId) {
          const s = await stripe.checkout.sessions.retrieve(earlier.stripeCheckoutSessionId);
          if (s.status === "open") await stripe.checkout.sessions.expire(s.id);
          else if (s.status === "complete") return; // Paid: the webhook fulfils it; never cancel a paid order.
        }
        await setOrderStatus(earlierId, "cancelled", { cancelReason: "replaced_by_new_checkout" }, ["pending"]);
      };
      if (!(await holdDiscount(q.discountCode, input.email, orderId, cancelEarlier))) {
        return NextResponse.json({ error: DISCOUNT_MESSAGES.used_up, discountMessage: DISCOUNT_MESSAGES.used_up }, { status: 422 });
      }
      held = { code: q.discountCode, orderId };
    }

    const session = await createCheckoutSession(stripe, {
      orderId,
      email: input.email,
      address: input.address,
      quote: q,
      returnUrl: `${siteOrigin(req)}/checkout?step=confirmation&order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      ...(user ? { userId: user.sub } : {}),
    });
    if (!session.client_secret) throw new Error("session has no client secret");
    // Tax (when Stripe Tax is on) is final only on the session; the order records what Stripe will charge.
    const amounts = sessionAmounts(session);

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
      taxCents: amounts.taxCents,
      totalCents: amounts.totalCents,
      ...(q.hasPreorder ? { preorder: "1" as const } : {}),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: "",
      refundedCents: 0,
      refunds: [],
      notes: [],
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      orderId,
      quote: { ...q, taxCents: amounts.taxCents, totalCents: amounts.totalCents },
    });
  } catch (err) {
    console.error("[checkout] session failed", (err as { type?: string }).type ?? (err as Error).name, (err as { code?: string }).code ?? "", (err as { param?: string }).param ?? "");
    if (held) await releaseDiscountHold(held.code, held.orderId).catch(() => undefined);
    if (err instanceof StripeConfigurationError) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "We couldn't start payment. Please try again." }, { status: 500 });
  }
}

/**
 * After a bank redirect (for example 3-D Secure) the shopper returns with the
 * session id. This reports only whether that order's payment went through;
 * the session must belong to the order named in the link.
 */
export async function GET(req: Request) {
  const limited = await limitByIp(req, "checkout-status", 30);
  if (limited) return limited;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") ?? "";
  const orderId = url.searchParams.get("order") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId) || !/^IP6-[A-Z0-9]{6,20}$/.test(orderId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const session = await (await getStripe()).checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId !== orderId) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // "paid" for cards; a bank debit can be complete but still "unpaid" until it clears.
    return NextResponse.json({ status: session.status, paymentStatus: session.payment_status }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[checkout] status failed", (err as Error).name);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

/**
 * Called by the payment page through Stripe.js (runServerUpdate). Re-applies
 * the order's own shipping address and rate to its session, from the order
 * record, never from the request. The browser sends only the session id.
 */
export async function PUT(req: Request) {
  const limited = await limitByIp(req, "checkout-shipping", 30);
  if (limited) return limited;
  const body = (await req.json().catch(() => null)) as { sessionId?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    const order = orderId ? await getOrder(orderId) : null;
    if (!order || order.stripeCheckoutSessionId !== session.id || order.status !== "pending" || session.status !== "open") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await applyShipping(stripe, session.id, order.shippingAddress, { label: order.shippingLabel, amountCents: order.shippingCents, currency: order.currency.toLowerCase() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checkout] shipping update failed", (err as { type?: string }).type ?? (err as Error).name);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

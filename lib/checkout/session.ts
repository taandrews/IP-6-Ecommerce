import "server-only";
import type Stripe from "stripe";
import type { Address } from "@/types";
import type { Quote } from "@/lib/pricing/quote";
import { STRIPE_TAX_ENABLED } from "@/lib/stripe/server";
import { productId } from "@/lib/stripe/sync";
import { ensureStripeProduct } from "@/lib/stripe/products";
import { SELLABLE_COUNTRIES } from "@/lib/countries";

/** How long a shopper has to pay before the session (and its discount hold) lapses. Stripe's minimum is 30 minutes. */
export const SESSION_TTL_SEC = 60 * 60;

/** Stripe's tax code for shipping charges. */
const SHIPPING_TAX_CODE = "txcd_92010001";

function stripeAddress(a: Address) {
  return {
    line1: a.line1,
    ...(a.line2 ? { line2: a.line2 } : {}),
    city: a.city,
    ...(a.region ? { state: a.region } : {}),
    postal_code: a.postalCode,
    country: a.country,
  };
}

/**
 * A Checkout Session (Payment Element on our own checkout page) for a quote
 * the server has already priced. Every amount comes from the quote: items at
 * their discounted unit price, the discount code as a single-use coupon and
 * the chosen shipping rate as the only option. Only the server can set the
 * shipping address and option (permissions: server_only), so the address the
 * quote was checked against is the one Stripe taxes and ships to.
 *
 * Subscriptions: the first period is part of this payment and the card is
 * saved for later (setup_future_usage), then each plan starts after payment
 * (lib/orders/events.ts). That keeps plans with different cycles in one order,
 * which subscription-mode sessions don't allow.
 */
export async function createCheckoutSession(
  stripe: Stripe,
  args: { orderId: string; email: string; address: Address; quote: Quote; returnUrl: string; userId?: string },
): Promise<Stripe.Checkout.Session> {
  const { orderId, quote: q, address } = args;
  const currency = q.currency.toLowerCase();
  const key = (part: string) => `checkout-${orderId}-${part}`;

  // Each line's product exists in Stripe (ip6_<sku>), so payments and reports group by product.
  await Promise.all([...new Map(q.lines.map((l) => [l.sku, l])).values()].map((l) => ensureStripeProduct(stripe, l.sku, l.name)));

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = q.lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency,
      product: productId(l.sku),
      unit_amount: l.lineTotalCents / l.qty,
      tax_behavior: "exclusive",
    },
  }));

  const coupon =
    q.discountCode && q.discountCents > 0
      ? await stripe.coupons.create(
          { amount_off: q.discountCents, currency, duration: "once", max_redemptions: 1, name: q.discountCode.slice(0, 40), metadata: { orderId, code: q.discountCode } },
          { idempotencyKey: key("coupon") },
        )
      : null;

  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: "elements",
      mode: "payment",
      line_items: lineItems,
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      customer_email: args.email,
      // Subscriptions need a customer with the card saved for the renewals.
      ...(q.hasSubscription ? { customer_creation: "always" as const } : {}),
      payment_intent_data: {
        description: `IP6 Original order ${orderId}`,
        receipt_email: args.email,
        metadata: { orderId },
        ...(q.hasSubscription ? { setup_future_usage: "off_session" as const } : {}),
      },
      // Stripe holds the shipping address too (copied to the payment), limited to
      // the countries we sell to; only this server can set or change it.
      shipping_address_collection: { allowed_countries: SELLABLE_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
      permissions: { update_shipping_details: "server_only" },
      automatic_tax: { enabled: STRIPE_TAX_ENABLED },
      metadata: { orderId, ...(args.userId ? { userId: args.userId } : {}) },
      client_reference_id: orderId,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
      return_url: args.returnUrl,
    },
    { idempotencyKey: key("create") },
  );

  const updated = await applyShipping(stripe, session.id, address, { label: `${q.shipping.label} · ${q.shipping.carrier}`, amountCents: q.shipping.amountCents, currency, etaDays: q.shipping.etaDays }, key("ship"));
  // Stripe returns the client secret only when the session is created.
  return { ...updated, client_secret: updated.client_secret ?? session.client_secret };
}

/**
 * Sets the session's shipping address and its one shipping option. Only this
 * server can (permissions: server_only): at creation, and again when the
 * payment page asks (runServerUpdate) so Stripe.js picks it up.
 */
export function applyShipping(
  stripe: Stripe,
  sessionId: string,
  address: Address,
  rate: { label: string; amountCents: number; currency: string; etaDays?: [number, number] },
  idempotencyKey?: string,
) {
  const option: Stripe.Checkout.SessionUpdateParams.ShippingOption = {
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: rate.label.slice(0, 100),
      fixed_amount: { amount: rate.amountCents, currency: rate.currency },
      ...(rate.etaDays
        ? { delivery_estimate: { minimum: { unit: "business_day", value: rate.etaDays[0] }, maximum: { unit: "business_day", value: rate.etaDays[1] } } }
        : {}),
      tax_behavior: "exclusive",
      tax_code: SHIPPING_TAX_CODE,
    },
  };
  return stripe.checkout.sessions.update(
    sessionId,
    { collected_information: { shipping_details: { name: address.name, address: stripeAddress(address) } }, shipping_options: [option] },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

/** What Stripe will charge for the session, for the order record. */
export function sessionAmounts(session: Stripe.Checkout.Session) {
  return { totalCents: session.amount_total ?? 0, taxCents: session.total_details?.amount_tax ?? 0 };
}

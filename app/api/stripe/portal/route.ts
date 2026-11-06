import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSubscriptionsForCustomer } from "@/lib/data/subscriptions";
import { siteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

/**
 * Opens Stripe's hosted billing portal so a subscriber can update their
 * card. Only the Stripe customer linked to this person's own subscriptions
 * is ever used.
 */
/**
 * The portal only lets people change their card and see invoices. Addresses
 * can't be edited there, because renewals ship to the address on the Stripe
 * customer and must stay inside the area we sell to; cancelling and pausing
 * happen on our own subscriptions page.
 */
let configId: string | null = null;
async function cardOnlyConfiguration(stripe: Stripe) {
  if (configId) return configId;
  const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  const found = existing.data.find((c) => c.metadata?.ip6 === "card_only");
  configId =
    found?.id ??
    (
      await stripe.billingPortal.configurations.create({
        metadata: { ip6: "card_only" },
        business_profile: {},
        features: {
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
          customer_update: { enabled: false },
          subscription_cancel: { enabled: false },
        },
      })
    ).id;
  return configId;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(siteUrl("/account/login", req), { status: 303 });
  const subs = await listSubscriptionsForCustomer(user.sub, user.emailVerified ? user.email : undefined).catch(() => []);
  const customer = subs.find((s) => s.stripeCustomerId)?.stripeCustomerId;
  if (!customer) return NextResponse.redirect(siteUrl("/account/payment-methods?portal=none", req), { status: 303 });
  try {
    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      configuration: await cardOnlyConfiguration(stripe),
      return_url: siteUrl("/account/subscriptions", req).toString(),
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error("[stripe] portal failed", (err as Error).name);
    return NextResponse.redirect(siteUrl("/account/payment-methods?portal=unavailable", req), { status: 303 });
  }
}

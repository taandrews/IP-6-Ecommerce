import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSubscriptionsForCustomer } from "@/lib/data/subscriptions";

export const runtime = "nodejs";

/**
 * Opens Stripe's hosted billing portal so a subscriber can update their
 * card. Only the Stripe customer linked to this person's own subscriptions
 * is ever used.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/account/login", req.url), { status: 303 });
  const subs = await listSubscriptionsForCustomer(user.sub, user.emailVerified ? user.email : undefined).catch(() => []);
  const customer = subs.find((s) => s.stripeCustomerId)?.stripeCustomerId;
  if (!customer) return NextResponse.redirect(new URL("/account/payment-methods?portal=none", req.url), { status: 303 });
  try {
    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: new URL("/account/subscriptions", req.url).toString(),
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error("[stripe] portal failed", (err as Error).name);
    return NextResponse.redirect(new URL("/account/payment-methods?portal=unavailable", req.url), { status: 303 });
  }
}

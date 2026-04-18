import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = getSessionUser();
  if (!user) return NextResponse.redirect("/account/login");
  // NOTE: Requires mapping user.sub -> Stripe customer ID in DynamoDB.
  // Placeholder returns the user to the account dashboard if not configured.
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.redirect("/account");
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.sub, // replace with persisted Stripe customer id in prod
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com"}/account`,
    });
    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect("/account/payment-methods?portal=unavailable");
  }
}

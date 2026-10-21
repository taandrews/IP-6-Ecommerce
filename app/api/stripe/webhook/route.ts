import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";
import { upsertFromStripe } from "@/lib/data/subscriptions";
import {
  handleChargeRefunded,
  handleDispute,
  handlePaymentSucceeded,
  handleRenewalFailed,
  handleRenewalPaid,
  handleRenewalUpcoming,
} from "@/lib/orders/events";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Every event is verified against the endpoint secret before
 * anything is read from it. Handlers are idempotent (conditional writes), so
 * Stripe's retries are safe; a 500 tells Stripe to retry later.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const [stripe, secret] = await Promise.all([getStripe(), getStripeWebhookSecret()]);
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(stripe, event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(stripe, event.data.object);
        break;
      case "charge.dispute.created":
        await handleDispute(event.data.object, stripe);
        break;
      case "invoice.payment_succeeded":
        await handleRenewalPaid(stripe, event.data.object);
        break;
      case "invoice.upcoming":
        await handleRenewalUpcoming(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleRenewalFailed(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await upsertFromStripe(event.data.object);
        break;
      case "customer.subscription.deleted": {
        const rec = await upsertFromStripe(event.data.object);
        if (rec.email) await sendEmailSafe(rec.email, emailTemplates.subscriptionCancelled("there", rec.productName), "subscription cancelled");
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe] webhook handler failed", event.type, (err as Error).name);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}

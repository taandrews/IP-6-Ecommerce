import "server-only";
import type Stripe from "stripe";
import { upsertFromStripe } from "@/lib/data/subscriptions";
import type { SubscriptionRecord } from "@/types/records";

export type SubscriptionOp = "pause" | "resume" | "skip" | "cancel";
export const SUBSCRIPTION_OPS: SubscriptionOp[] = ["pause", "resume", "skip", "cancel"];

/**
 * Applies a change in Stripe (the source of truth) and refreshes the local
 * mirror. Shared by the customer account page and the admin portal.
 *
 * - pause:  renewal invoices are voided, so nothing is charged or shipped.
 * - resume: renewals continue on the existing schedule.
 * - skip:   moves the next renewal back by one full cycle.
 * - cancel: ends the plan now; nothing further is charged.
 */
export async function applySubscriptionOp(stripe: Stripe, rec: SubscriptionRecord, op: SubscriptionOp) {
  let sub: Stripe.Subscription;
  switch (op) {
    case "pause":
      sub = await stripe.subscriptions.update(rec.subscriptionId, { pause_collection: { behavior: "void" } });
      break;
    case "resume":
      sub = await stripe.subscriptions.update(rec.subscriptionId, { pause_collection: null } as unknown as Stripe.SubscriptionUpdateParams);
      break;
    case "skip": {
      const current = await stripe.subscriptions.retrieve(rec.subscriptionId);
      const next = current.trial_end && current.trial_end > Date.now() / 1000 ? current.trial_end : current.current_period_end;
      sub = await stripe.subscriptions.update(rec.subscriptionId, {
        trial_end: next + rec.cycleDays * 86400,
        proration_behavior: "none",
      });
      break;
    }
    case "cancel":
      sub = await stripe.subscriptions.cancel(rec.subscriptionId);
      break;
  }
  return upsertFromStripe(sub);
}

import "server-only";
import type Stripe from "stripe";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, INDEXES, TABLES } from "@/lib/aws/dynamo";
import type { Currency } from "@/types";
import type { SubscriptionRecord, SubscriptionStatus } from "@/types/records";
import { emailKey } from "./orders";

export function mapStripeStatus(sub: Stripe.Subscription): SubscriptionStatus {
  if (sub.pause_collection) return "paused";
  switch (sub.status) {
    case "active":
      return "active";
    case "trialing":
      // The first period is paid at checkout, so a "trial" here is an active plan.
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    case "paused":
      return "paused";
    default:
      return "incomplete";
  }
}

/** Mirrors a Stripe subscription into DynamoDB. Stripe stays the source of truth. */
export async function upsertFromStripe(sub: Stripe.Subscription) {
  const m = sub.metadata ?? {};
  const item = sub.items.data[0];
  const nextCharge = sub.pause_collection ? undefined : sub.trial_end ?? sub.current_period_end;
  const existing = await getSubscription(sub.id);
  const record: SubscriptionRecord = {
    subscriptionId: sub.id,
    status: mapStripeStatus(sub),
    ...(m.userId ? { userId: m.userId } : existing?.userId ? { userId: existing.userId } : {}),
    email: m.email ?? existing?.email ?? "",
    emailKey: emailKey(m.email ?? existing?.email ?? ""),
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    sku: m.sku ?? existing?.sku ?? "",
    variantId: m.variantId ?? existing?.variantId ?? "",
    productName: m.productName ?? existing?.productName ?? "Subscription",
    cycleDays: Number(m.cycleDays ?? existing?.cycleDays ?? 0),
    priceCents: item?.price?.unit_amount ?? existing?.priceCents ?? 0,
    currency: (sub.currency?.toUpperCase() as Currency) ?? existing?.currency ?? "USD",
    ...(nextCharge ? { nextChargeDate: new Date(nextCharge * 1000).toISOString() } : {}),
    orderId: m.orderId ?? existing?.orderId ?? "",
    createdAt: existing?.createdAt ?? new Date(sub.created * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!record.email) return record; // anonymized; nothing to index by email
  await docClient.send(new PutCommand({ TableName: TABLES.Subscriptions, Item: record }));
  return record;
}

export async function getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null> {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.Subscriptions, Key: { subscriptionId } }));
  return (res.Item as SubscriptionRecord | undefined) ?? null;
}

export async function listSubscriptionsForCustomer(userId: string | undefined, email: string | undefined) {
  const out = new Map<string, SubscriptionRecord>();
  if (userId) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLES.Subscriptions,
        IndexName: INDEXES.subscriptionsByUser,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }),
    );
    for (const r of (res.Items ?? []) as SubscriptionRecord[]) out.set(r.subscriptionId, r);
  }
  if (email) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLES.Subscriptions,
        IndexName: INDEXES.subscriptionsByEmail,
        KeyConditionExpression: "emailKey = :e",
        ExpressionAttributeValues: { ":e": emailKey(email) },
      }),
    );
    for (const r of (res.Items ?? []) as SubscriptionRecord[]) out.set(r.subscriptionId, r);
  }
  return [...out.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** By status, soonest renewal first (status + nextChargeDate index). */
export async function listSubscriptionsByStatus(status: SubscriptionStatus, limit = 100) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.Subscriptions,
      IndexName: INDEXES.subscriptionsByStatus,
      KeyConditionExpression: "#s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status },
      ScanIndexForward: true,
      Limit: Math.min(limit, 200),
    }),
  );
  return (res.Items ?? []) as SubscriptionRecord[];
}

/**
 * A customer may act on a subscription only if it is theirs: linked to their
 * account, or bought with their verified email address.
 */
export function ownsSubscription(rec: SubscriptionRecord, user: { sub: string; email: string; emailVerified: boolean }) {
  if (rec.userId && rec.userId === user.sub) return true;
  return user.emailVerified && !!rec.emailKey && rec.emailKey === emailKey(user.email);
}

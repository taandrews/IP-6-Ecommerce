import "server-only";
import crypto from "node:crypto";
import { DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { deleteCustomerAccount, findAccountByEmail, type CustomerAccount } from "@/lib/aws/cognito";
import { getStripe } from "@/lib/stripe/server";
import type { OrderRecord, ReviewRecord, SubscriptionRecord } from "@/types/records";
import { emailKey, listOrdersByEmail, listOrdersByUser, PAID_STATUSES } from "./orders";
import { listSubscriptionsForCustomer } from "./subscriptions";
import { anonymizeReviewsForUser, listReviewsByUser } from "./reviews";
import { deleteWaitlistEntry, getWaitlistEntry, type WaitlistRecord } from "./waitlist";

export function newsletterKey(email: string) {
  return `newsletter_${emailKey(email)}`;
}

export interface CustomerProfile {
  email: string;
  account: CustomerAccount | null;
  orders: OrderRecord[];
  subscriptions: SubscriptionRecord[];
  reviews: ReviewRecord[];
  newsletter: { subscribed: boolean; consentedAt?: string; source?: string; consentVersion?: string; quiz?: Record<string, string>; quizAt?: string } | null;
  waitlist: WaitlistRecord | null;
  totals: { orderCount: number; spent: Record<string, number> };
}

/** Everything held about one customer, keyed by email (and account id if any). */
export async function getCustomerProfile(email: string): Promise<CustomerProfile> {
  const account = await findAccountByEmail(email).catch(() => null);
  const [byEmail, byUser, subscriptions, reviews, newsletterRow, waitlist] = await Promise.all([
    listOrdersByEmail(email, 500),
    account ? listOrdersByUser(account.sub, 500) : Promise.resolve([] as OrderRecord[]),
    listSubscriptionsForCustomer(account?.sub, email),
    account ? listReviewsByUser(account.sub) : Promise.resolve([] as ReviewRecord[]),
    docClient.send(new GetCommand({ TableName: TABLES.Users, Key: { userId: newsletterKey(email) } })).then((r) => r.Item ?? null),
    getWaitlistEntry(email),
  ]);
  const orders = [...new Map([...byEmail, ...byUser].map((o) => [o.orderId, o])).values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const spent: Record<string, number> = {};
  for (const o of paid) spent[o.currency] = (spent[o.currency] ?? 0) + o.totalCents - (o.refundedCents ?? 0);
  return {
    email: emailKey(email),
    account,
    orders,
    subscriptions,
    reviews,
    newsletter: newsletterRow
      ? {
          subscribed: newsletterRow.newsletter === true,
          consentedAt: newsletterRow.consentedAt ?? newsletterRow.createdAt,
          source: newsletterRow.source,
          consentVersion: newsletterRow.consentVersion,
          quiz: newsletterRow.quiz,
          quizAt: newsletterRow.quizAt,
        }
      : null,
    waitlist,
    totals: { orderCount: paid.length, spent },
  };
}

/**
 * Data-portability export (GDPR art. 20, CCPA right to know): a JSON copy of
 * the personal data held in this system. Payment card details are never
 * stored here; Stripe holds them.
 */
export function buildExport(p: CustomerProfile) {
  return {
    generatedAt: new Date().toISOString(),
    controller: "IP6 Original",
    note: "Card details are processed and stored by Stripe and are not held by IP6 Original.",
    email: p.email,
    account: p.account ? { name: p.account.name, email: p.account.email, createdAt: p.account.createdAt, status: p.account.status } : null,
    newsletter: p.newsletter,
    launchWaitlist: p.waitlist
      ? {
          country: p.waitlist.country,
          firstName: p.waitlist.firstName,
          countryFromIp: p.waitlist.ipCountry,
          products: p.waitlist.products,
          signedUpOn: p.waitlist.page,
          consentedAt: p.waitlist.consentedAt,
          consentWordingVersion: p.waitlist.consentVersion,
        }
      : null,
    orders: p.orders.map((o) => ({
      orderId: o.orderId,
      status: o.status,
      createdAt: o.createdAt,
      name: o.customerName,
      email: o.email,
      phone: o.phone,
      shippingAddress: o.shippingAddress,
      items: o.items.map((l) => ({ product: l.name, option: l.variantLabel, qty: l.qty, total: l.lineTotalCents / 100 })),
      currency: o.currency,
      total: o.totalCents / 100,
      refunded: (o.refundedCents ?? 0) / 100,
      shipping: o.fulfillment ? { carrier: o.fulfillment.carrier, trackingNumber: o.fulfillment.trackingNumber, shippedAt: o.fulfillment.shippedAt } : null,
    })),
    subscriptions: p.subscriptions.map((s) => ({
      product: s.productName,
      status: s.status,
      everyDays: s.cycleDays,
      price: s.priceCents / 100,
      currency: s.currency,
      nextChargeDate: s.nextChargeDate,
      startedAt: s.createdAt,
    })),
    reviews: p.reviews.map((r) => ({ product: r.sku, rating: r.rating, title: r.title, body: r.body, status: r.status, createdAt: r.createdAt })),
  };
}

function erasedEmail(email: string) {
  const h = crypto.createHash("sha256").update(emailKey(email)).digest("hex").slice(0, 12);
  return { email: `erased-${h}@invalid`, emailKey: `erased#${h}` };
}

/**
 * Right to erasure. Orders are kept for tax and accounting law but lose every
 * personal field; subscriptions are cancelled; reviews lose their author; the
 * newsletter row, Stripe customers and the login account are deleted.
 * Returns a summary for the audit log (counts only, no personal data).
 */
export async function eraseCustomer(email: string) {
  const p = await getCustomerProfile(email);
  const stripe = await getStripe();
  const summary = { orders: 0, subscriptions: 0, reviews: 0, stripeCustomers: 0, account: false, newsletter: false, waitlist: false };
  const now = new Date().toISOString();
  const anon = erasedEmail(email);

  for (const s of p.subscriptions) {
    if (s.status !== "cancelled") {
      await stripe.subscriptions.cancel(s.subscriptionId).catch((err) => {
        if ((err as { code?: string }).code !== "resource_missing") throw err;
      });
    }
    await docClient.send(new DeleteCommand({ TableName: TABLES.Subscriptions, Key: { subscriptionId: s.subscriptionId } }));
    summary.subscriptions++;
  }

  const customerIds = new Set<string>();
  for (const o of p.orders) {
    if (o.stripeCustomerId) customerIds.add(o.stripeCustomerId);
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Orders,
        Key: { orderId: o.orderId },
        UpdateExpression:
          "SET email = :e, emailKey = :k, customerName = :n, shippingAddress = :a, anonymizedAt = :t, updatedAt = :t REMOVE phone, userId, notes",
        ExpressionAttributeValues: {
          ":e": anon.email,
          ":k": anon.emailKey,
          ":n": "Erased customer",
          ":a": { name: "", line1: "", city: "", region: o.shippingAddress?.region ?? "", postalCode: "", country: o.shippingAddress?.country ?? "" },
          ":t": now,
        },
      }),
    );
    summary.orders++;
  }
  for (const s of p.subscriptions) customerIds.add(s.stripeCustomerId);
  for (const id of customerIds) {
    await stripe.customers.del(id).catch((err) => {
      if ((err as { code?: string }).code !== "resource_missing") throw err;
    });
    summary.stripeCustomers++;
  }

  if (p.account) {
    summary.reviews = await anonymizeReviewsForUser(p.account.sub);
    await deleteCustomerAccount(p.account.username);
    summary.account = true;
  }
  if (p.newsletter) {
    await docClient.send(new DeleteCommand({ TableName: TABLES.Users, Key: { userId: newsletterKey(email) } }));
    summary.newsletter = true;
  }
  if (p.waitlist) {
    await deleteWaitlistEntry(email);
    summary.waitlist = true;
  }
  return summary;
}

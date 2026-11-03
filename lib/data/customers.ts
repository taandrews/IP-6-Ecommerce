import "server-only";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { findCustomers, requestShopifyErasure, type CustomerSummary } from "@/lib/shopify/admin";
import { emailKey, newsletterKey } from "./keys";
import { deleteWaitlistEntry, getWaitlistEntry, type WaitlistRecord } from "./waitlist";

export { emailKey, newsletterKey };

/**
 * What this site holds about one email address: the newsletter and launch
 * waitlist sign-ups. Orders, subscriptions, addresses and the customer
 * account live in Shopify, listed here from the Admin API.
 */
export interface CustomerProfile {
  email: string;
  shopify: CustomerSummary[];
  newsletter: {
    subscribed: boolean;
    /** Signed up but hasn't clicked the confirmation link yet. */
    pending: boolean;
    requestedAt?: string;
    consentedAt?: string;
    confirmedAt?: string;
    source?: string;
    consentVersion?: string;
    quiz?: Record<string, string>;
    quizAt?: string;
  } | null;
  waitlist: WaitlistRecord | null;
}

export async function getCustomerProfile(email: string): Promise<CustomerProfile> {
  const [shopify, newsletterRow, waitlist] = await Promise.all([
    findCustomers(email).then((list) => list.filter((c) => c.email.toLowerCase() === emailKey(email))),
    docClient.send(new GetCommand({ TableName: TABLES.Users, Key: { userId: newsletterKey(email) } })).then((r) => r.Item ?? null),
    getWaitlistEntry(email),
  ]);
  return {
    email: emailKey(email),
    shopify,
    newsletter: newsletterRow
      ? {
          subscribed: newsletterRow.newsletter === true,
          pending: newsletterRow.newsletter !== true && Boolean(newsletterRow.requestedAt) && !newsletterRow.unsubscribedAt,
          requestedAt: newsletterRow.requestedAt,
          consentedAt: newsletterRow.consentedAt ?? (newsletterRow.newsletter === true ? newsletterRow.createdAt : undefined),
          confirmedAt: newsletterRow.confirmedAt,
          source: newsletterRow.source,
          consentVersion: newsletterRow.consentVersion,
          quiz: newsletterRow.quiz,
          quizAt: newsletterRow.quizAt,
        }
      : null,
    waitlist,
  };
}

/**
 * Data-portability export of what this site holds. Order, account and
 * subscription data is held by Shopify and exported from Shopify admin
 * (Customers > the customer > Export customer data).
 */
export function buildExport(p: CustomerProfile) {
  return {
    generatedAt: new Date().toISOString(),
    controller: "IP6 Original",
    note: "Orders, subscriptions, addresses and the customer account are held by Shopify and exported separately from Shopify. Card details are held by Shopify Payments.",
    email: p.email,
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
  };
}

/**
 * Right to erasure. Deletes this site's newsletter and waitlist rows and asks
 * Shopify to erase the customer (Shopify keeps order records it must hold by
 * law and completes the erasure on its own schedule). Returns counts only.
 */
export async function eraseCustomer(email: string) {
  const p = await getCustomerProfile(email);
  const summary = { newsletter: false, waitlist: false, shopifyCustomers: 0 };
  if (p.newsletter) {
    await docClient.send(new DeleteCommand({ TableName: TABLES.Users, Key: { userId: newsletterKey(email) } }));
    summary.newsletter = true;
  }
  if (p.waitlist) {
    await deleteWaitlistEntry(email);
    summary.waitlist = true;
  }
  summary.shopifyCustomers = await requestShopifyErasure(email);
  return summary;
}

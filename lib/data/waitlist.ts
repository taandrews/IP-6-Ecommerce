import "server-only";
import { DeleteCommand, GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailKey } from "./orders";
import { WAITLIST_CONSENT_VERSION } from "@/lib/waitlist-consent";

/**
 * Launch waitlist for countries we don't sell to yet. One row per email in
 * the Users table under its own key prefix, kept apart from customers and the
 * US newsletter. Raw IP addresses are never stored; only the country
 * CloudFront derived from it.
 */
/** Unconfirmed sign-ups are deleted after this long (DynamoDB TTL). */
const PENDING_TTL_SECONDS = 60 * 60 * 24 * 30;

export function waitlistKey(email: string) {
  return `waitlist_${emailKey(email)}`;
}


export interface WaitlistRecord {
  userId: string;
  email: string;
  segment: "waitlist";
  country: string;
  firstName?: string;
  ipCountry?: string;
  /** SKUs the visitor was looking at, across signups. */
  products?: string[];
  lastProduct?: string;
  page: string;
  source: "product" | "checkout";
  /** Which storefront the signup came from. */
  site?: "amplify" | "shopify";
  consentVersion: string;
  consentedAt: string;
  /** When the visitor clicked the confirmation link (double opt-in). */
  confirmedAt?: string;
  /** Epoch seconds; unconfirmed sign-ups are deleted then. */
  expiresAt?: number;
  createdAt: string;
  updatedAt: string;
}

export async function saveWaitlist(input: {
  email: string;
  country: string;
  firstName?: string;
  ipCountry?: string;
  product?: string;
  page: string;
  source: WaitlistRecord["source"];
  site?: "amplify" | "shopify";
}) {
  const now = new Date().toISOString();
  const Key = { userId: waitlistKey(input.email) };
  // Anyone can type someone else's address, so the first sign-up's details
  // and consent are kept (if_not_exists); later ones only refresh where the
  // visitor was browsing. The owner confirms through the emailed link
  // (lib/data/confirmations.ts); until then the row expires after 30 days.
  const keep: Record<string, unknown> = {
    email: emailKey(input.email),
    segment: "waitlist",
    country: input.country,
    site: input.site ?? "amplify",
    consentVersion: WAITLIST_CONSENT_VERSION,
    consentedAt: now,
    createdAt: now,
    ...(input.firstName ? { firstName: input.firstName } : {}),
    ...(input.ipCountry ? { ipCountry: input.ipCountry } : {}),
  };
  const latest: Record<string, unknown> = {
    page: input.page,
    source: input.source,
    updatedAt: now,
    ...(input.product ? { lastProduct: input.product } : {}),
  };
  // Every attribute goes through a name placeholder: several (segment, source, page) are DynamoDB reserved words.
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets: string[] = [];
  Object.entries({ ...keep, ...latest }).forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:f${i}`] = v;
    sets.push(k in keep ? `#f${i} = if_not_exists(#f${i}, :f${i})` : `#f${i} = :f${i}`);
  });
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Users,
      Key,
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
  // Unconfirmed sign-ups expire; a confirmed one never gets an expiry.
  await docClient
    .send(
      new UpdateCommand({
        TableName: TABLES.Users,
        Key,
        UpdateExpression: "SET #exp = :exp",
        ConditionExpression: "attribute_not_exists(#cf)",
        ExpressionAttributeNames: { "#exp": "expiresAt", "#cf": "confirmedAt" },
        ExpressionAttributeValues: { ":exp": Math.floor(Date.now() / 1000) + PENDING_TTL_SECONDS },
      }),
    )
    .catch((err) => {
      if ((err as Error).name !== "ConditionalCheckFailedException") throw err;
    });
  if (input.product) {
    // Each SKU is listed once, so repeat sign-ups can't grow the row.
    await docClient
      .send(
        new UpdateCommand({
          TableName: TABLES.Users,
          Key,
          UpdateExpression: "SET #products = list_append(if_not_exists(#products, :empty), :plist)",
          ConditionExpression: "attribute_not_exists(#products) OR NOT contains(#products, :p)",
          ExpressionAttributeNames: { "#products": "products" },
          ExpressionAttributeValues: { ":empty": [], ":plist": [input.product], ":p": input.product },
        }),
      )
      .catch((err) => {
        if ((err as Error).name !== "ConditionalCheckFailedException") throw err;
      });
  }
}

export async function getWaitlistEntry(email: string): Promise<WaitlistRecord | null> {
  const r = await docClient.send(new GetCommand({ TableName: TABLES.Users, Key: { userId: waitlistKey(email) } }));
  return (r.Item as WaitlistRecord | undefined) ?? null;
}

export async function deleteWaitlistEntry(email: string) {
  await docClient.send(new DeleteCommand({ TableName: TABLES.Users, Key: { userId: waitlistKey(email) } }));
}

/** Every waitlist row (a filtered scan; the list is small and only read by staff). */
export async function listWaitlist(): Promise<WaitlistRecord[]> {
  const out: WaitlistRecord[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const r = await docClient.send(
      new ScanCommand({
        TableName: TABLES.Users,
        FilterExpression: "begins_with(userId, :p)",
        ExpressionAttributeValues: { ":p": "waitlist_" },
        ExclusiveStartKey: start,
      }),
    );
    out.push(...((r.Items ?? []) as WaitlistRecord[]));
    start = r.LastEvaluatedKey;
  } while (start);
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

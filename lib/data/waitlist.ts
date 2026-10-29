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
  consentVersion: string;
  consentedAt: string;
  /** Set once double opt-in email is in place and the visitor confirms. */
  confirmedAt?: string;
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
}) {
  const now = new Date().toISOString();
  // Every attribute goes through a name placeholder: several (segment, source, page) are DynamoDB reserved words.
  const fields: Record<string, unknown> = {
    email: emailKey(input.email),
    segment: "waitlist",
    country: input.country,
    page: input.page,
    source: input.source,
    consentVersion: WAITLIST_CONSENT_VERSION,
    consentedAt: now,
    updatedAt: now,
    ...(input.firstName ? { firstName: input.firstName } : {}),
    ...(input.ipCountry ? { ipCountry: input.ipCountry } : {}),
    ...(input.product ? { lastProduct: input.product } : {}),
  };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":now": now };
  const sets: string[] = [];
  Object.entries(fields).forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:f${i}`] = v;
    sets.push(`#f${i} = :f${i}`);
  });
  names["#created"] = "createdAt";
  sets.push("#created = if_not_exists(#created, :now)");
  if (input.product) {
    names["#products"] = "products";
    values[":empty"] = [];
    values[":plist"] = [input.product];
    sets.push("#products = list_append(if_not_exists(#products, :empty), :plist)");
  }
  let update = `SET ${sets.join(", ")}`;
  if (!input.ipCountry) {
    names["#ip"] = "ipCountry";
    update += " REMOVE #ip";
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Users,
      Key: { userId: waitlistKey(input.email) },
      UpdateExpression: update,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
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

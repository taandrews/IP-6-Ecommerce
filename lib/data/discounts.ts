import "server-only";
import crypto from "node:crypto";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import type { Currency } from "@/types";
import type { DiscountRecord } from "@/types/records";
import { evaluateDiscount, normalizeCode, type DiscountCheck } from "@/lib/pricing/discount";

export { normalizeCode };

export async function getDiscount(code: string): Promise<DiscountRecord | null> {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.DiscountCodes, Key: { code: normalizeCode(code) } }));
  return (res.Item as DiscountRecord | undefined) ?? null;
}

export async function listDiscounts(): Promise<DiscountRecord[]> {
  const out: DiscountRecord[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(new ScanCommand({ TableName: TABLES.DiscountCodes, ExclusiveStartKey: start }));
    out.push(...((res.Items ?? []) as DiscountRecord[]));
    start = res.LastEvaluatedKey;
  } while (start);
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createDiscount(d: DiscountRecord) {
  await docClient.send(
    new PutCommand({ TableName: TABLES.DiscountCodes, Item: d, ConditionExpression: "attribute_not_exists(code)" }),
  );
}

export async function setDiscountActive(code: string, active: boolean) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.DiscountCodes,
      Key: { code },
      UpdateExpression: "SET active = :a",
      ConditionExpression: "attribute_exists(code)",
      ExpressionAttributeValues: { ":a": active ? "1" : "0" },
    }),
  );
}

/** Ends a code now (keeps the record and its usage history). */
export async function expireDiscount(code: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.DiscountCodes,
      Key: { code },
      UpdateExpression: "SET active = :z, expiresAt = :now",
      ConditionExpression: "attribute_exists(code)",
      ExpressionAttributeValues: { ":z": "0", ":now": new Date().toISOString() },
    }),
  );
}

export async function deleteDiscount(code: string) {
  await docClient.send(new DeleteCommand({ TableName: TABLES.DiscountCodes, Key: { code } }));
}

function customerHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function redemptionsFor(code: string, email: string) {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLES.DiscountRedemptions, Key: { code, customer: customerHash(email) } }),
  );
  return Number(res.Item?.count ?? 0);
}

/** Validates a code for a cart at checkout. Never changes usage counts. */
export async function checkDiscount(
  rawCode: string,
  ctx: { subtotalCents: number; currency: Currency; email: string },
): Promise<DiscountCheck> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "invalid" };
  const d = await getDiscount(code);
  const used = d?.perCustomerLimit ? await redemptionsFor(code, ctx.email) : 0;
  return evaluateDiscount(d, { ...ctx, customerRedemptions: used, now: new Date() });
}

/**
 * Counts a redemption once the order is paid. The global limit is enforced
 * atomically; if it was reached between checkout and payment, the order
 * keeps its price (the customer already paid) and staff see it flagged.
 */
export async function recordRedemption(code: string, email: string, orderId: string) {
  let withinLimit = true;
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.DiscountCodes,
        Key: { code },
        UpdateExpression: "SET usesCount = if_not_exists(usesCount, :zero) + :one",
        ConditionExpression: "attribute_exists(code) AND (attribute_not_exists(maxUses) OR usesCount < maxUses)",
        ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
      }),
    );
  } catch (err) {
    if ((err as Error).name !== "ConditionalCheckFailedException") throw err;
    withinLimit = false;
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.DiscountRedemptions,
      Key: { code, customer: customerHash(email) },
      UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :one, lastOrderId = :o, updatedAt = :u",
      ExpressionAttributeNames: { "#c": "count" },
      ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":o": orderId, ":u": new Date().toISOString() },
    }),
  );
  return withinLimit;
}

import "server-only";
import crypto from "node:crypto";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import type { Currency } from "@/types";
import type { DiscountRecord } from "@/types/records";
import { canonicalEmail, evaluateDiscount, normalizeCode, type DiscountCheck } from "@/lib/pricing/discount";

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
  return crypto.createHash("sha256").update(canonicalEmail(email)).digest("hex");
}

/** How long a checkout keeps its use of a limited code before paying. */
const HOLD_SECONDS = 30 * 60;
const holdKey = (orderId: string) => `hold#${orderId}`;

interface Hold {
  code: string;
  customer: string;
  holder: string;
  expiresAt: number;
}

async function liveHolds(code: string): Promise<Hold[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.DiscountRedemptions,
      KeyConditionExpression: "code = :c AND begins_with(customer, :h)",
      FilterExpression: "expiresAt > :now",
      ExpressionAttributeValues: { ":c": code, ":h": "hold#", ":now": Math.floor(Date.now() / 1000) },
      ConsistentRead: true,
    }),
  );
  return (res.Items ?? []) as Hold[];
}

/**
 * Reserves one use of a limited code for a checkout before payment starts,
 * so ten checkouts opened at once can't all use a one-time code. Unpaid holds
 * lapse after 30 minutes. Every reservation also bumps a version number on
 * the code with a condition, so two checkouts racing for the last use can't
 * both win. Codes without limits need no hold. Someone going back and
 * starting payment again replaces their own earlier hold, and `onReplaced`
 * cancels that earlier unpaid checkout so only one can be paid.
 */
export async function holdDiscount(
  rawCode: string,
  email: string,
  orderId: string,
  onReplaced?: (orderId: string) => Promise<void>,
): Promise<boolean> {
  const code = normalizeCode(rawCode);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await docClient.send(new GetCommand({ TableName: TABLES.DiscountCodes, Key: { code }, ConsistentRead: true }));
    const d = res.Item as (DiscountRecord & { holdVersion?: number }) | undefined;
    if (!d) return false;
    const maxUses = typeof d.maxUses === "number" ? d.maxUses : null;
    const perCustomer = typeof d.perCustomerLimit === "number" ? d.perCustomerLimit : null;
    if (maxUses === null && perCustomer === null) return true;
    const me = customerHash(email);
    const all = await liveHolds(code);
    const mine = all.filter((h) => h.holder === me);
    const others = all.length - mine.length;
    if (maxUses !== null && (d.usesCount ?? 0) + others >= maxUses) return false;
    if (perCustomer !== null && (await redemptionsFor(code, email)) >= perCustomer) return false;
    const seen = d.holdVersion ?? 0;
    try {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: TABLES.DiscountCodes,
                Key: { code },
                UpdateExpression: "SET holdVersion = :next",
                ConditionExpression: seen === 0 ? "attribute_not_exists(holdVersion) OR holdVersion = :seen" : "holdVersion = :seen",
                ExpressionAttributeValues: { ":next": seen + 1, ":seen": seen },
              },
            },
            {
              Put: {
                TableName: TABLES.DiscountRedemptions,
                Item: { code, customer: holdKey(orderId), holder: me, expiresAt: Math.floor(Date.now() / 1000) + HOLD_SECONDS } satisfies Hold,
              },
            },
          ],
        }),
      );
      for (const h of mine) {
        const earlier = h.customer.slice("hold#".length);
        await onReplaced?.(earlier).catch((err) => console.error("[discounts] replacing hold failed", (err as Error).name));
        await releaseDiscountHold(code, earlier);
      }
      return true;
    } catch (err) {
      // Another checkout changed the holds first: look again.
      if ((err as Error).name !== "TransactionCanceledException") throw err;
    }
  }
  return false;
}

/** Gives the use back when a checkout never reached payment. */
export async function releaseDiscountHold(rawCode: string, orderId: string) {
  await docClient.send(new DeleteCommand({ TableName: TABLES.DiscountRedemptions, Key: { code: normalizeCode(rawCode), customer: holdKey(orderId) } }));
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
  const check = evaluateDiscount(d, { ...ctx, customerRedemptions: used, now: new Date() });
  // Uses held by checkouts that haven't paid yet count against the limit.
  const me = customerHash(ctx.email);
  if (check.ok && typeof d?.maxUses === "number" && d.usesCount + (await liveHolds(code)).filter((h) => h.holder !== me).length >= d.maxUses) {
    return { ok: false, reason: "used_up" };
  }
  return check;
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
  await releaseDiscountHold(code, orderId);
  return withinLimit;
}

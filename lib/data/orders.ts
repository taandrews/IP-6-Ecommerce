import "server-only";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, INDEXES, TABLES } from "@/lib/aws/dynamo";
import type { OrderRecord, OrderStatus } from "@/types/records";
import { decodeCursor, encodeCursor } from "./cursor";

/** Unpaid checkouts are removed after 7 days by DynamoDB TTL. */
const PENDING_TTL_SECONDS = 60 * 60 * 24 * 7;

export function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export async function createPendingOrder(order: Omit<OrderRecord, "expiresAt">) {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.Orders,
      Item: { ...order, expiresAt: Math.floor(Date.now() / 1000) + PENDING_TTL_SECONDS },
      ConditionExpression: "attribute_not_exists(orderId)",
    }),
  );
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.Orders, Key: { orderId } }));
  return (res.Item as OrderRecord | undefined) ?? null;
}

/**
 * Marks a pending order paid exactly once. Returns false when it was already
 * paid (Stripe retries webhooks), so side effects run a single time.
 */
export async function markPaid(orderId: string, paymentIntentId: string, amountCents: number, customerId?: string) {
  const now = new Date().toISOString();
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Orders,
        Key: { orderId },
        UpdateExpression: "SET #s = :paid, paidAt = :now, updatedAt = :now, stripeCustomerId = :c REMOVE expiresAt",
        ConditionExpression: "#s = :pending AND stripePaymentIntentId = :pi AND totalCents = :amt",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":paid": "paid",
          ":pending": "pending",
          ":now": now,
          ":pi": paymentIntentId,
          ":amt": amountCents,
          ":c": customerId ?? null,
        },
      }),
    );
    return true;
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

export async function setOrderStatus(orderId: string, status: OrderStatus, extra: Record<string, unknown> = {}, expectFrom?: OrderStatus[]) {
  const sets = ["#s = :s", "updatedAt = :u"];
  const values: Record<string, unknown> = { ":s": status, ":u": new Date().toISOString() };
  Object.entries(extra).forEach(([k, v], i) => {
    sets.push(`#e${i} = :e${i}`);
    values[`:e${i}`] = v;
  });
  const names: Record<string, string> = { "#s": "status" };
  Object.keys(extra).forEach((k, i) => (names[`#e${i}`] = k));
  let condition = "attribute_exists(orderId)";
  if (expectFrom?.length) {
    condition += ` AND #s IN (${expectFrom.map((_, i) => `:f${i}`).join(", ")})`;
    expectFrom.forEach((f, i) => (values[`:f${i}`] = f));
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Orders,
      Key: { orderId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ConditionExpression: condition,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}

export async function appendOrderList(orderId: string, field: "notes" | "refunds", entry: unknown, extraSet?: Record<string, unknown>) {
  const names: Record<string, string> = { "#f": field };
  const values: Record<string, unknown> = { ":e": [entry], ":empty": [], ":u": new Date().toISOString() };
  const sets = ["#f = list_append(if_not_exists(#f, :empty), :e)", "updatedAt = :u"];
  Object.entries(extraSet ?? {}).forEach(([k, v], i) => {
    names[`#x${i}`] = k;
    values[`:x${i}`] = v;
    sets.push(`#x${i} = :x${i}`);
  });
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Orders,
      Key: { orderId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ConditionExpression: "attribute_exists(orderId)",
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}

export interface OrderPage {
  orders: OrderRecord[];
  cursor?: string;
}

/** Newest first within one status, via the status index. */
export async function listOrdersByStatus(status: OrderStatus, cursor?: string, limit = 50): Promise<OrderPage> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.Orders,
      IndexName: INDEXES.ordersByStatus,
      KeyConditionExpression: "#s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status },
      ScanIndexForward: false,
      Limit: Math.min(limit, 100),
      ExclusiveStartKey: decodeCursor(cursor, ["orderId", "status", "createdAt"]),
    }),
  );
  return { orders: (res.Items ?? []) as OrderRecord[], cursor: encodeCursor(res.LastEvaluatedKey) };
}

/** Several statuses merged newest first; used for the default order list. */
export async function listRecentOrders(statuses: OrderStatus[], limit = 50): Promise<OrderRecord[]> {
  const pages = await Promise.all(statuses.map((s) => listOrdersByStatus(s, undefined, limit)));
  return pages
    .flatMap((p) => p.orders)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function listOrdersByEmail(email: string, limit = 100): Promise<OrderRecord[]> {
  const out: OrderRecord[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLES.Orders,
        IndexName: INDEXES.ordersByEmail,
        KeyConditionExpression: "emailKey = :e",
        ExpressionAttributeValues: { ":e": emailKey(email) },
        ScanIndexForward: false,
        ExclusiveStartKey: start,
      }),
    );
    out.push(...((res.Items ?? []) as OrderRecord[]));
    start = res.LastEvaluatedKey;
  } while (start && out.length < limit);
  return out.slice(0, limit);
}

export async function listOrdersByUser(userId: string, limit = 100): Promise<OrderRecord[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.Orders,
      IndexName: INDEXES.ordersByUser,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return (res.Items ?? []) as OrderRecord[];
}

/** Orders in a date range for one status (createdAt is ISO, so it sorts). */
export async function listOrdersInRange(status: OrderStatus, fromIso: string, toIso: string): Promise<OrderRecord[]> {
  const out: OrderRecord[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLES.Orders,
        IndexName: INDEXES.ordersByStatus,
        KeyConditionExpression: "#s = :s AND createdAt BETWEEN :a AND :b",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status, ":a": fromIso, ":b": toIso },
        ExclusiveStartKey: start,
      }),
    );
    out.push(...((res.Items ?? []) as OrderRecord[]));
    start = res.LastEvaluatedKey;
  } while (start);
  return out;
}

/** The statuses that count as a real, paid order. */
export const PAID_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered", "partially_refunded", "refunded"];
/** Paid and not yet shipped. */
export const OPEN_STATUSES: OrderStatus[] = ["paid", "processing"];

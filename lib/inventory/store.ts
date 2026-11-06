import "server-only";
import crypto from "node:crypto";
import { QueryCommand, ScanCommand, TransactWriteCommand, UpdateCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";

/**
 * Inventory, built the way multi-warehouse retailers run it:
 *
 * - Locations (warehouses, 3PLs) each ship to a set of countries, in priority order.
 * - A position per SKU and location holds on hand, reserved and available
 *   (on hand - reserved - safety stock). Available can go below zero only
 *   within the position's backorder limit (pre-orders).
 * - Lots (production batches) carry an expiry date. Sales draw from the lot
 *   that expires first (FEFO) and never from an expired lot; each order
 *   records the lots it shipped from, so a recall reaches exactly its buyers.
 * - Checkout holds stock (reserved) while the shopper pays; payment turns the
 *   hold into a sale, expiry or cancellation releases it.
 * - Every change to stock on hand is written to an append-only ledger in the
 *   same transaction as the change, with who did it and why.
 *
 * All counters change inside DynamoDB transactions with conditions, so two
 * shoppers can't both take the last unit and a retry can't apply twice.
 *
 * A SKU with no position anywhere is "untracked" and sells as before; the
 * dashboard flags it until stock is received.
 */

export interface Location {
  locationId: string;
  name: string;
  /** ISO country codes this location ships to; "*" for anywhere. */
  countries: string[];
  /** Lower ships first when several locations can fill an order. */
  priority: number;
  active: boolean;
  updatedAt: string;
}

export interface Position {
  sku: string;
  locationId: string;
  onHand: number;
  reserved: number;
  /** onHand - reserved - safetyStock. */
  available: number;
  safetyStock: number;
  lowStockThreshold: number;
  /** How far below zero available may go (pre-orders and backorders); 0 = never. */
  backorderLimit: number;
  lowAlertedAt?: string;
  updatedAt: string;
}

export interface Lot {
  sku: string;
  locationId: string;
  lotNo: string;
  onHand: number;
  /** YYYY-MM-DD. */
  expiresOn: string;
  receivedAt: string;
}

export type MovementType = "receive" | "sale" | "return" | "damage" | "expired" | "count" | "correction" | "transfer_out" | "transfer_in";

export interface Movement {
  sku: string;
  locationId: string;
  lotNo: string | null;
  type: MovementType;
  /** Change to on hand (negative for stock leaving). */
  qty: number;
  orderId?: string;
  actor: string;
  reason?: string;
  at: string;
}

export interface Allocation {
  sku: string;
  locationId: string;
  /** Null when sold before any lot was received (backorder): assigned when stock arrives. */
  lotNo: string | null;
  qty: number;
}

export class InventoryError extends Error {
  constructor(public code: "not_enough_stock" | "no_location" | "unknown_location" | "lot_short" | "invalid") {
    super(code);
    this.name = "InventoryError";
  }
}

const T = () => TABLES.Stock;
const now = () => new Date().toISOString();
const posKey = (sku: string, loc: string) => ({ pk: `SKU#${sku}`, sk: `POS#${loc}` });
const lotKey = (sku: string, loc: string, lot: string) => ({ pk: `SKU#${sku}`, sk: `LOT#${loc}#${lot}` });
const holdPk = (orderId: string) => `HOLD#${orderId}`;
const today = () => new Date().toISOString().slice(0, 10);

function ledgerPut(m: Movement): NonNullable<TransactWriteCommandInput["TransactItems"]>[number] {
  return {
    Put: {
      TableName: T(),
      Item: { pk: `LEDGER#${m.sku}`, sk: `${m.at}#${crypto.randomBytes(4).toString("hex")}`, ...m },
      ConditionExpression: "attribute_not_exists(pk)",
    },
  };
}

async function transact(items: NonNullable<TransactWriteCommandInput["TransactItems"]>) {
  if (!items.length) return;
  await docClient.send(new TransactWriteCommand({ TransactItems: items }));
}

const cancelled = (err: unknown) => (err as Error).name === "TransactionCanceledException";

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export async function listLocations(): Promise<Location[]> {
  const res = await docClient.send(new QueryCommand({ TableName: T(), KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": "LOC" } }));
  return ((res.Items ?? []) as Location[]).sort((a, b) => a.priority - b.priority);
}

export async function saveLocation(loc: Omit<Location, "updatedAt">) {
  await docClient.send(new PutCommand({ TableName: T(), Item: { pk: "LOC", sk: loc.locationId, ...loc, updatedAt: now() } }));
}

const serves = (loc: Location, country: string) => loc.active && (loc.countries.includes("*") || loc.countries.includes(country.toUpperCase()));

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function skuStock(sku: string): Promise<{ positions: Position[]; lots: Lot[] }> {
  const res = await docClient.send(new QueryCommand({ TableName: T(), KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": `SKU#${sku}` } }));
  const items = res.Items ?? [];
  return {
    positions: items.filter((i) => String(i.sk).startsWith("POS#")) as Position[],
    lots: (items.filter((i) => String(i.sk).startsWith("LOT#")) as Lot[]).sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)),
  };
}

/** Every position and lot, for the dashboard, the storefront and the daily check. */
export async function allStock(): Promise<{ positions: Position[]; lots: Lot[] }> {
  const positions: Position[] = [];
  const lots: Lot[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(new ScanCommand({ TableName: T(), FilterExpression: "begins_with(pk, :s)", ExpressionAttributeValues: { ":s": "SKU#" }, ExclusiveStartKey: start }));
    for (const i of res.Items ?? []) {
      if (String(i.sk).startsWith("POS#")) positions.push(i as Position);
      else if (String(i.sk).startsWith("LOT#")) lots.push(i as Lot);
    }
    start = res.LastEvaluatedKey;
  } while (start);
  return { positions, lots };
}

export async function ledger(sku: string, limit = 200): Promise<Movement[]> {
  const res = await docClient.send(
    new QueryCommand({ TableName: T(), KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": `LEDGER#${sku}` }, ScanIndexForward: false, Limit: limit }),
  );
  return (res.Items ?? []) as Movement[];
}

// ---------------------------------------------------------------------------
// Settings per position
// ---------------------------------------------------------------------------

export async function setPositionSettings(sku: string, locationId: string, s: { safetyStock: number; lowStockThreshold: number; backorderLimit: number }) {
  if ([s.safetyStock, s.lowStockThreshold, s.backorderLimit].some((n) => !Number.isInteger(n) || n < 0)) throw new InventoryError("invalid");
  const current = (await docClient.send(new GetCommand({ TableName: T(), Key: posKey(sku, locationId) }))).Item as Position | undefined;
  const oldSafety = current?.safetyStock ?? 0;
  // Available moves by the change in safety stock; the condition makes a concurrent change retry instead of drifting.
  await docClient.send(
    new UpdateCommand({
      TableName: T(),
      Key: posKey(sku, locationId),
      UpdateExpression:
        "SET sku = :sku, locationId = :loc, onHand = if_not_exists(onHand, :z), reserved = if_not_exists(reserved, :z), available = if_not_exists(available, :z) + :delta, safetyStock = :s, lowStockThreshold = :t, backorderLimit = :b, updatedAt = :u",
      ConditionExpression: "attribute_not_exists(pk) OR safetyStock = :old",
      ExpressionAttributeValues: { ":sku": sku, ":loc": locationId, ":z": 0, ":delta": oldSafety - s.safetyStock, ":s": s.safetyStock, ":t": s.lowStockThreshold, ":b": s.backorderLimit, ":u": now(), ":old": oldSafety },
    }),
  );
}

// ---------------------------------------------------------------------------
// Movements: receive, adjust, transfer
// ---------------------------------------------------------------------------

/** Fields a position gets when the first stock arrives at a location. */
const POSITION_CREATE =
  "sku = :sku, locationId = :loc, reserved = if_not_exists(reserved, :z), safetyStock = if_not_exists(safetyStock, :z), lowStockThreshold = if_not_exists(lowStockThreshold, :z), backorderLimit = if_not_exists(backorderLimit, :z)";

/** Goods in: adds to a lot (created on first receipt) and the position, and logs it. */
export async function receive(input: { sku: string; locationId: string; lotNo: string; expiresOn: string; qty: number; actor: string; reason?: string }) {
  const { sku, locationId, lotNo, expiresOn, qty, actor } = input;
  if (!Number.isInteger(qty) || qty <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) || !lotNo.trim()) throw new InventoryError("invalid");
  if (!(await listLocations()).some((l) => l.locationId === locationId)) throw new InventoryError("unknown_location");
  const at = now();
  await transact([
    {
      Update: {
        TableName: T(),
        Key: lotKey(sku, locationId, lotNo),
        UpdateExpression: "SET sku = :sku, locationId = :loc, lotNo = :lot, onHand = if_not_exists(onHand, :z) + :q, expiresOn = :exp, receivedAt = if_not_exists(receivedAt, :at)",
        // A lot keeps one expiry date; a mismatch is a data-entry error, not a new lot.
        ConditionExpression: "attribute_not_exists(pk) OR expiresOn = :exp",
        ExpressionAttributeValues: { ":sku": sku, ":loc": locationId, ":lot": lotNo, ":z": 0, ":q": qty, ":exp": expiresOn, ":at": at },
      },
    },
    {
      Update: {
        TableName: T(),
        Key: posKey(sku, locationId),
        UpdateExpression: `SET ${POSITION_CREATE}, onHand = if_not_exists(onHand, :z) + :q, available = if_not_exists(available, :z) + :q, updatedAt = :at REMOVE lowAlertedAt`,
        ExpressionAttributeValues: { ":sku": sku, ":loc": locationId, ":z": 0, ":q": qty, ":at": at },
      },
    },
    ledgerPut({ sku, locationId, lotNo, type: "receive", qty, actor, ...(input.reason ? { reason: input.reason } : {}), at }),
  ]);
}

/** Stock out or in that isn't a sale: damage, expiry write-off, count or correction. */
export async function adjust(input: { sku: string; locationId: string; lotNo: string; delta: number; type: "damage" | "expired" | "count" | "correction"; actor: string; reason: string }) {
  const { sku, locationId, lotNo, delta, actor } = input;
  if (!Number.isInteger(delta) || delta === 0 || !input.reason.trim()) throw new InventoryError("invalid");
  const at = now();
  try {
    await transact([
      {
        Update: {
          TableName: T(),
          Key: lotKey(sku, locationId, lotNo),
          UpdateExpression: "SET onHand = onHand + :d",
          ConditionExpression: "attribute_exists(pk) AND onHand >= :min",
          ExpressionAttributeValues: { ":d": delta, ":min": Math.max(0, -delta) },
        },
      },
      {
        Update: {
          TableName: T(),
          Key: posKey(sku, locationId),
          UpdateExpression: "SET onHand = onHand + :d, available = available + :d, updatedAt = :at",
          ConditionExpression: "attribute_exists(pk)",
          ExpressionAttributeValues: { ":d": delta, ":at": at },
        },
      },
      ledgerPut({ sku, locationId, lotNo, type: input.type, qty: delta, actor, reason: input.reason, at }),
    ]);
  } catch (err) {
    if (cancelled(err)) throw new InventoryError("lot_short");
    throw err;
  }
}

/** Moves part of a lot to another location, keeping its lot number and expiry. */
export async function transfer(input: { sku: string; from: string; to: string; lotNo: string; qty: number; actor: string; reason?: string }) {
  const { sku, from, to, lotNo, qty, actor } = input;
  if (!Number.isInteger(qty) || qty <= 0 || from === to) throw new InventoryError("invalid");
  if (!(await listLocations()).some((l) => l.locationId === to)) throw new InventoryError("unknown_location");
  const source = (await docClient.send(new GetCommand({ TableName: T(), Key: lotKey(sku, from, lotNo) }))).Item as Lot | undefined;
  if (!source || source.onHand < qty) throw new InventoryError("lot_short");
  const at = now();
  try {
    await transact([
      { Update: { TableName: T(), Key: lotKey(sku, from, lotNo), UpdateExpression: "SET onHand = onHand - :q", ConditionExpression: "onHand >= :q", ExpressionAttributeValues: { ":q": qty } } },
      {
        Update: {
          TableName: T(),
          Key: posKey(sku, from),
          UpdateExpression: "SET onHand = onHand - :q, available = available - :q, updatedAt = :at",
          ConditionExpression: "attribute_exists(pk)",
          ExpressionAttributeValues: { ":q": qty, ":at": at },
        },
      },
      {
        Update: {
          TableName: T(),
          Key: lotKey(sku, to, lotNo),
          UpdateExpression: "SET sku = :sku, locationId = :loc, lotNo = :lot, onHand = if_not_exists(onHand, :z) + :q, expiresOn = :exp, receivedAt = if_not_exists(receivedAt, :at)",
          ExpressionAttributeValues: { ":sku": sku, ":loc": to, ":lot": lotNo, ":z": 0, ":q": qty, ":exp": source.expiresOn, ":at": at },
        },
      },
      {
        Update: {
          TableName: T(),
          Key: posKey(sku, to),
          UpdateExpression: `SET ${POSITION_CREATE}, onHand = if_not_exists(onHand, :z) + :q, available = if_not_exists(available, :z) + :q, updatedAt = :at`,
          ExpressionAttributeValues: { ":sku": sku, ":loc": to, ":z": 0, ":q": qty, ":at": at },
        },
      },
      ledgerPut({ sku, locationId: from, lotNo, type: "transfer_out", qty: -qty, actor, reason: input.reason ?? `to ${to}`, at }),
      ledgerPut({ sku, locationId: to, lotNo, type: "transfer_in", qty, actor, reason: input.reason ?? `from ${from}`, at }),
    ]);
  } catch (err) {
    if (cancelled(err)) throw new InventoryError("lot_short");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Checkout: hold, release, commit
// ---------------------------------------------------------------------------

interface Hold {
  orderId: string;
  sku: string;
  locationId: string;
  qty: number;
  holdUntil: string;
}

/**
 * Holds stock for an order while the shopper pays. Each tracked SKU is held
 * at the highest-priority location that ships to the country and has enough
 * available (within its backorder limit). Untracked SKUs are skipped.
 */
export async function hold(orderId: string, lines: Array<{ sku: string; qty: number }>, country: string, holdUntil: Date) {
  const want = new Map<string, number>();
  for (const l of lines) want.set(l.sku, (want.get(l.sku) ?? 0) + l.qty);
  const locations = (await listLocations()).filter((l) => serves(l, country));
  const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [];
  for (const [sku, qty] of want) {
    const { positions } = await skuStock(sku);
    if (!positions.length) continue; // untracked
    const pick = locations
      .map((loc) => positions.find((p) => p.locationId === loc.locationId))
      .find((p): p is Position => !!p && p.available + p.backorderLimit >= qty);
    if (!pick) throw new InventoryError(locations.length ? "not_enough_stock" : "no_location");
    items.push({
      Update: {
        TableName: T(),
        Key: posKey(sku, pick.locationId),
        UpdateExpression: "SET reserved = reserved + :q, available = available - :q, updatedAt = :at",
        ConditionExpression: "available >= :need",
        ExpressionAttributeValues: { ":q": qty, ":need": qty - pick.backorderLimit, ":at": now() },
      },
    });
    const h: Hold = { orderId, sku, locationId: pick.locationId, qty, holdUntil: holdUntil.toISOString() };
    items.push({ Put: { TableName: T(), Item: { pk: holdPk(orderId), sk: `${sku}#${pick.locationId}`, holdState: "held", ...h }, ConditionExpression: "attribute_not_exists(pk)" } });
  }
  try {
    await transact(items);
  } catch (err) {
    // Someone took the stock between the read and the write.
    if (cancelled(err)) throw new InventoryError("not_enough_stock");
    throw err;
  }
}

async function holdsFor(orderId: string): Promise<Array<Hold & { pk: string; sk: string }>> {
  const res = await docClient.send(new QueryCommand({ TableName: T(), KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": holdPk(orderId) } }));
  return (res.Items ?? []) as Array<Hold & { pk: string; sk: string }>;
}

/** Releases an order's holds (checkout expired, failed or replaced). Safe to repeat. */
export async function release(orderId: string) {
  for (const h of await holdsFor(orderId)) {
    try {
      await transact([
        { Delete: { TableName: T(), Key: { pk: h.pk, sk: h.sk }, ConditionExpression: "attribute_exists(pk)" } },
        {
          Update: {
            TableName: T(),
            Key: posKey(h.sku, h.locationId),
            UpdateExpression: "SET reserved = reserved - :q, available = available + :q, updatedAt = :at",
            ExpressionAttributeValues: { ":q": h.qty, ":at": now() },
          },
        },
      ]);
    } catch (err) {
      if (!cancelled(err)) throw err; // already released or committed
    }
  }
}

/** A bank payment can take days: keep the hold until it clears or fails. */
export async function extendHolds(orderId: string, until: Date) {
  for (const h of await holdsFor(orderId)) {
    await docClient.send(
      new UpdateCommand({ TableName: T(), Key: { pk: h.pk, sk: h.sk }, UpdateExpression: "SET holdUntil = :u", ConditionExpression: "attribute_exists(pk)", ExpressionAttributeValues: { ":u": until.toISOString() } }),
    ).catch((err) => {
      if ((err as Error).name !== "ConditionalCheckFailedException") throw err;
    });
  }
}

/** Splits a quantity across a location's lots, earliest expiry first, never an expired lot. */
function fefo(lots: Lot[], locationId: string, qty: number): Allocation[] {
  const out: Allocation[] = [];
  let left = qty;
  for (const lot of lots.filter((l) => l.locationId === locationId && l.onHand > 0 && l.expiresOn >= today()).sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))) {
    if (left <= 0) break;
    const take = Math.min(left, lot.onHand);
    out.push({ sku: lot.sku, locationId, lotNo: lot.lotNo, qty: take });
    left -= take;
  }
  if (left > 0) out.push({ sku: lots[0]?.sku ?? "", locationId, lotNo: null, qty: left });
  return out;
}

/**
 * Payment received: each hold becomes a sale. On hand and the lots go down,
 * the ledger records each lot sold, the order records its allocations and
 * the hold is removed, all in one transaction per SKU. Repeating it is safe:
 * each SKU's sale writes a SOLD marker for the order, so a retry, a duplicate
 * webhook or a restart after a partial run never sells the same stock twice.
 *
 * A paid order is never refused. If its hold was already released (payment
 * after the checkout expired), the sale is recorded anyway and returned as
 * oversold so staff can act.
 */
export async function commit(orderId: string, lines: Array<{ sku: string; qty: number }>, actor = "system"): Promise<{ allocations: Allocation[]; oversold: string[] }> {
  const holds = await holdsFor(orderId);
  const allocations: Allocation[] = [];
  const oversold: string[] = [];
  const bySku = new Map<string, number>();
  for (const l of lines) bySku.set(l.sku, (bySku.get(l.sku) ?? 0) + l.qty);

  for (const [sku, qty] of bySku) {
    const h = holds.find((x) => x.sku === sku);
    const { positions, lots } = await skuStock(sku);
    if (!positions.length) continue; // untracked
    const locationId = h?.locationId ?? [...positions].sort((a, b) => b.available - a.available)[0]!.locationId;
    const parts = fefo(lots.filter((l) => l.sku === sku), locationId, qty).map((p) => ({ ...p, sku }));
    const at = now();
    const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      // One sale per order and SKU, ever: a retried or duplicate commit finds this marker and stops.
      { Put: { TableName: T(), Item: { pk: `SOLD#${orderId}`, sk: sku, at }, ConditionExpression: "attribute_not_exists(pk)" } },
      ...(h ? [{ Delete: { TableName: T(), Key: { pk: h.pk, sk: h.sk }, ConditionExpression: "attribute_exists(pk)" } }] : []),
      {
        Update: {
          TableName: T(),
          Key: posKey(sku, locationId),
          UpdateExpression: h
            ? "SET onHand = onHand - :q, reserved = reserved - :q, updatedAt = :at"
            : "SET onHand = onHand - :q, available = available - :q, updatedAt = :at",
          ExpressionAttributeValues: { ":q": qty, ":at": at },
        },
      },
    ];
    for (const p of parts) {
      if (p.lotNo) {
        items.push({
          Update: { TableName: T(), Key: lotKey(sku, locationId, p.lotNo), UpdateExpression: "SET onHand = onHand - :q", ConditionExpression: "onHand >= :q", ExpressionAttributeValues: { ":q": p.qty } },
        });
      }
      items.push(ledgerPut({ sku, locationId, lotNo: p.lotNo, type: "sale", qty: -p.qty, orderId, actor, ...(p.lotNo ? {} : { reason: "sold before stock arrived (backorder)" }), at }));
    }
    items.push({
      Update: {
        TableName: TABLES.Orders,
        Key: { orderId },
        UpdateExpression: "SET stockAllocations = list_append(if_not_exists(stockAllocations, :e), :a)",
        ExpressionAttributeValues: { ":e": [], ":a": parts },
      },
    });
    try {
      await transact(items);
      allocations.push(...parts);
      if (!h) oversold.push(sku);
    } catch (err) {
      if (!cancelled(err)) throw err;
      // Already sold by an earlier delivery: nothing to do for this SKU.
      const done = Boolean((await docClient.send(new GetCommand({ TableName: T(), Key: { pk: `SOLD#${orderId}`, sk: sku } }))).Item);
      if (done) continue;
      // A lot changed between reading and writing: fail so the event is retried with fresh lots.
      throw err;
    }
  }
  return { allocations, oversold };
}

/** Puts an order's sold stock back into the lots it came from (cancelled or returned unopened). Safe to repeat. */
export async function returnToStock(orderId: string, allocations: Allocation[], actor: string, reason: string) {
  const at = now();
  for (const [i, a] of allocations.entries()) {
    const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      // One marker per allocation line: a repeated return does nothing.
      { Put: { TableName: T(), Item: { pk: `RETURN#${orderId}`, sk: String(i), at }, ConditionExpression: "attribute_not_exists(pk)" } },
      {
        Update: {
          TableName: T(),
          Key: posKey(a.sku, a.locationId),
          UpdateExpression: "SET onHand = onHand + :q, available = available + :q, updatedAt = :at",
          ExpressionAttributeValues: { ":q": a.qty, ":at": at },
        },
      },
      ledgerPut({ sku: a.sku, locationId: a.locationId, lotNo: a.lotNo, type: "return", qty: a.qty, orderId, actor, reason, at }),
    ];
    if (a.lotNo) items.push({ Update: { TableName: T(), Key: lotKey(a.sku, a.locationId, a.lotNo), UpdateExpression: "SET onHand = onHand + :q", ExpressionAttributeValues: { ":q": a.qty } } });
    try {
      await transact(items);
    } catch (err) {
      if (!cancelled(err)) throw err;
    }
  }
}

/** Holds whose time ran out without a webhook releasing them (the daily safety sweep). */
export async function expiredHolds(): Promise<string[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: T(),
      IndexName: "byHold",
      KeyConditionExpression: "holdState = :h AND holdUntil < :now",
      ExpressionAttributeValues: { ":h": "held", ":now": now() },
    }),
  );
  return [...new Set((res.Items ?? []).map((i) => String(i.orderId)))];
}

/** Marks a low-stock alert sent; false if one went out in the last day. */
export async function claimLowStockAlert(sku: string, locationId: string) {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: T(),
        Key: posKey(sku, locationId),
        UpdateExpression: "SET lowAlertedAt = :n",
        ConditionExpression: "attribute_exists(pk) AND (attribute_not_exists(lowAlertedAt) OR lowAlertedAt < :d)",
        ExpressionAttributeValues: { ":n": now(), ":d": dayAgo },
      }),
    );
    return true;
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

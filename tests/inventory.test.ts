import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/aws/dynamo";
import type { Location, Lot, Position } from "@/lib/inventory/store";
import { summarize } from "@/lib/inventory/availability";
import { diffCount, parseCountCsv } from "@/lib/inventory/count";
import { dailyReport } from "@/lib/inventory/alerts";

vi.mock("next/cache", () => ({ revalidateTag: () => undefined, unstable_cache: (fn: () => unknown) => fn }));

const ddb = mockClient(DynamoDBDocumentClient);
const store = await import("@/lib/inventory/store");
const US_ID = "loc_a1b2c3d4e5f6";

const us: Location = { locationId: "loc_a1b2c3d4e5f6", code: "MD1", name: "Maryland warehouse", type: "warehouse", operator: { company: "IP6 Original", phone: "+12025550143" }, contact: { name: "Sam Lee", email: "ops@example.com", phone: "+12025550143" }, address: { line1: "1 Main St", city: "Lutherville", region: "MD", postalCode: "21093", country: "US" }, countries: ["US"], priority: 1, active: true, updatedAt: "" };
const eu: Location = { locationId: "loc_0f9e8d7c6b5a", code: "DE1", name: "EU partner", type: "3pl", operator: { company: "IP6 Original", phone: "+12025550143" }, contact: { name: "Sam Lee", email: "ops@example.com", phone: "+12025550143" }, address: { line1: "2 Hauptstr", city: "Berlin", country: "DE" }, countries: ["DE", "FR"], priority: 2, active: true, updatedAt: "" };
const pos = (over: Partial<Position> = {}): Position => ({
  sku: "SUP-IP6-CAP240",
  locationId: "loc_a1b2c3d4e5f6",
  onHand: 10,
  reserved: 0,
  available: 10,
  safetyStock: 0,
  lowStockThreshold: 3,
  backorderLimit: 0,
  updatedAt: "",
  ...over,
});
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const lot = (lotNo: string, onHand: number, expiresOn: string, locationId = "loc_a1b2c3d4e5f6"): Lot => ({ sku: "SUP-IP6-CAP240", locationId, lotNo, onHand, expiresOn, receivedAt: "" });

/** Answers the store's queries: locations, a SKU's positions and lots, an order's holds. */
function world(w: { positions?: Position[]; lots?: Lot[]; holds?: Array<Record<string, unknown>> }) {
  ddb.on(QueryCommand).callsFake((input: { ExpressionAttributeValues: Record<string, string> }) => {
    const p = input.ExpressionAttributeValues[":p"];
    if (p === "LOC") return { Items: [us, eu].map((l) => ({ pk: "LOC", sk: l.locationId, ...l })) };
    if (p?.startsWith("SKU#")) {
      return {
        Items: [
          ...(w.positions ?? []).map((x) => ({ pk: p, sk: `POS#${x.locationId}`, ...x })),
          ...(w.lots ?? []).map((x) => ({ pk: p, sk: `LOT#${x.locationId}#${x.lotNo}`, ...x })),
        ],
      };
    }
    if (p?.startsWith("HOLD#")) return { Items: w.holds ?? [] };
    return { Items: [] };
  });
}

const tx = () => ddb.commandCalls(TransactWriteCommand).map((c) => c.args[0].input.TransactItems!);

beforeEach(() => {
  ddb.reset();
  ddb.on(TransactWriteCommand).resolves({});
  ddb.on(UpdateCommand).resolves({});
  ddb.on(GetCommand).resolves({});
});

describe("checkout holds", () => {
  it("holds stock at the first location that ships to the country and has enough, with a guarded update", async () => {
    world({ positions: [pos()] });
    await store.hold("IP6-ORDER1", [{ sku: "SUP-IP6-CAP240", qty: 2 }], "US", new Date(Date.now() + 3600e3));
    const items = tx()[0]!;
    const upd = items.find((i) => i.Update)!.Update!;
    expect(upd.ConditionExpression).toBe("available >= :need");
    expect(upd.ExpressionAttributeValues).toMatchObject({ ":q": 2, ":need": 2 });
    expect(items.find((i) => i.Put)!.Put!.Item).toMatchObject({ pk: "HOLD#IP6-ORDER1", holdState: "held", locationId: "loc_a1b2c3d4e5f6", qty: 2 });
  });

  it("allows pre-orders down to the backorder limit and no further", async () => {
    world({ positions: [pos({ onHand: 0, available: 0, backorderLimit: 5 })] });
    await store.hold("IP6-ORDER2", [{ sku: "SUP-IP6-CAP240", qty: 5 }], "US", new Date());
    expect(tx()[0]!.find((i) => i.Update)!.Update!.ExpressionAttributeValues).toMatchObject({ ":need": 0 });
    await expect(store.hold("IP6-ORDER3", [{ sku: "SUP-IP6-CAP240", qty: 6 }], "US", new Date())).rejects.toMatchObject({ code: "not_enough_stock" });
  });

  it("refuses when no location ships to the country, and when the last unit is taken concurrently", async () => {
    world({ positions: [pos()] });
    await expect(store.hold("IP6-ORDER4", [{ sku: "SUP-IP6-CAP240", qty: 1 }], "JP", new Date())).rejects.toMatchObject({ code: "no_location" });
    ddb.on(TransactWriteCommand).rejects(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    await expect(store.hold("IP6-ORDER5", [{ sku: "SUP-IP6-CAP240", qty: 1 }], "US", new Date())).rejects.toMatchObject({ code: "not_enough_stock" });
  });

  it("skips untracked SKUs (no position anywhere)", async () => {
    world({});
    await store.hold("IP6-ORDER6", [{ sku: "SUP-IP6-CAP240", qty: 1 }], "US", new Date());
    expect(tx()).toHaveLength(0);
  });

  it("releases each hold once, returning it to available", async () => {
    world({ holds: [{ pk: "HOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240#loc_a1b2c3d4e5f6", orderId: "IP6-ORDER1", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", qty: 2 }] });
    await store.release("IP6-ORDER1");
    const items = tx()[0]!;
    expect(items[0]!.Delete!.ConditionExpression).toBe("attribute_exists(pk)");
    expect(items[1]!.Update!.UpdateExpression).toContain("reserved = reserved - :q, available = available + :q");
  });
});

describe("sale on payment", () => {
  it("sells from the lot that expires first, never an expired lot, logs each lot and records it on the order", async () => {
    world({
      positions: [pos({ reserved: 5, available: 5 })],
      lots: [lot("LATE", 10, future(400)), lot("SOON", 3, future(30)), lot("EXPIRED", 50, "2020-01-01")],
      holds: [{ pk: "HOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240#loc_a1b2c3d4e5f6", orderId: "IP6-ORDER1", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", qty: 5 }],
    });
    const { allocations, oversold } = await store.commit("IP6-ORDER1", [{ sku: "SUP-IP6-CAP240", qty: 5 }]);
    expect(oversold).toEqual([]);
    expect(allocations).toEqual([
      { sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "SOON", qty: 3 },
      { sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "LATE", qty: 2 },
    ]);
    const items = tx()[0]!;
    expect(items[0]!.Put).toMatchObject({ Item: { pk: "SOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240" }, ConditionExpression: "attribute_not_exists(pk)" });
    expect(items[1]!.Delete).toBeDefined();
    expect(items[2]!.Update!.UpdateExpression).toContain("onHand = onHand - :q, reserved = reserved - :q");
    const ledger = items.filter((i) => i.Put && String(i.Put.Item!.pk).startsWith("LEDGER#")).map((i) => i.Put!.Item!);
    expect(ledger.map((m) => [m.lotNo, m.qty, m.type, m.orderId])).toEqual([
      ["SOON", -3, "sale", "IP6-ORDER1"],
      ["LATE", -2, "sale", "IP6-ORDER1"],
    ]);
    expect(items.find((i) => i.Update?.TableName === TABLES.Orders)!.Update!.UpdateExpression).toContain("stockAllocations");
  });

  it("never refuses a paid order: with no hold left it still sells and reports the oversell", async () => {
    world({ positions: [pos({ onHand: 0, available: 0 })], lots: [], holds: [] });
    const { allocations, oversold } = await store.commit("IP6-LATE1", [{ sku: "SUP-IP6-CAP240", qty: 1 }]);
    expect(oversold).toEqual(["SUP-IP6-CAP240"]);
    expect(allocations).toEqual([{ sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: null, qty: 1 }]);
    expect(tx()[0]![0]!.Put!.ConditionExpression).toBe("attribute_not_exists(pk)");
  });

  it("does nothing when a concurrent delivery sold it first", async () => {
    world({ positions: [pos()], lots: [lot("A", 10, future(100))], holds: [{ pk: "HOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240#loc_a1b2c3d4e5f6", orderId: "IP6-ORDER1", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", qty: 1 }] });
    ddb.on(TransactWriteCommand).rejectsOnce(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    ddb.on(GetCommand, { Key: { pk: "SOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240" } }).resolves({ Item: { pk: "SOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240" } });
    await expect(store.commit("IP6-ORDER1", [{ sku: "SUP-IP6-CAP240", qty: 1 }])).resolves.toEqual({ allocations: [], oversold: [] });
  });

  it("never sells twice on a retry after the hold was consumed (restart between sale and step record)", async () => {
    // The first run sold it and removed the hold; the retry sees no hold and must not sell again as an oversell.
    world({ positions: [pos()], lots: [lot("A", 10, future(100))], holds: [] });
    ddb.on(TransactWriteCommand).rejects(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    ddb.on(GetCommand, { Key: { pk: "SOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240" } }).resolves({ Item: { pk: "SOLD#IP6-ORDER1", sk: "SUP-IP6-CAP240" } });
    await expect(store.commit("IP6-ORDER1", [{ sku: "SUP-IP6-CAP240", qty: 1 }])).resolves.toEqual({ allocations: [], oversold: [] });
  });

  it("returns cancelled stock to the lots it came from, once", async () => {
    await store.returnToStock("IP6-ORDER1", [{ sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "SOON", qty: 3 }], "staff@ip6original.com", "cancelled");
    const items = tx()[0]!;
    expect(items[0]!.Put!).toMatchObject({ Item: { pk: "RETURN#IP6-ORDER1", sk: "0" }, ConditionExpression: "attribute_not_exists(pk)" });
    expect(items.find((i) => i.Put && String(i.Put.Item!.pk).startsWith("LEDGER#"))!.Put!.Item).toMatchObject({ type: "return", qty: 3, lotNo: "SOON" });
  });
});

describe("goods in and adjustments", () => {
  it("receives into a lot with one expiry date, logs it and creates the position", async () => {
    world({});
    await store.receive({ sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "L2601", expiresOn: "2028-06-30", qty: 100, actor: "staff@ip6original.com", reason: "PO 17" });
    const items = tx()[0]!;
    expect(items[0]!.Update!.ConditionExpression).toBe("attribute_not_exists(pk) OR expiresOn = :exp");
    expect(items[1]!.Update!.UpdateExpression).toContain("available = if_not_exists(available, :z) + :q");
    expect(items[2]!.Put!.Item).toMatchObject({ type: "receive", qty: 100, lotNo: "L2601", reason: "PO 17" });
  });

  it("rejects receipts at unknown locations and bad numbers", async () => {
    world({});
    await expect(store.receive({ sku: "SUP-IP6-CAP240", locationId: "nowhere", lotNo: "A", expiresOn: "2028-01-01", qty: 1, actor: "x" })).rejects.toMatchObject({ code: "unknown_location" });
    await expect(store.receive({ sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "A", expiresOn: "2028-01-01", qty: 0, actor: "x" })).rejects.toMatchObject({ code: "invalid" });
  });

  it("never takes a lot below zero", async () => {
    ddb.on(TransactWriteCommand).rejects(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    await expect(store.adjust({ sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "A", delta: -5, type: "damage", actor: "x", reason: "crushed" })).rejects.toMatchObject({ code: "lot_short" });
  });
});

describe("locations and barcodes", () => {
  const fields = { name: "Maryland warehouse", type: "warehouse" as const, operator: { company: "IP6 Original", phone: "+12025550143" }, contact: { name: "Sam Lee", email: "ops@example.com", phone: "+12025550143" }, address: { line1: "1 Main St", city: "Lutherville", region: "MD", postalCode: "21093", country: "US" }, countries: ["US"], priority: 1, active: true };

  it("gives a new location a permanent system ID and claims its code in the same transaction", async () => {
    const id = await store.createLocation({ code: "MD1", ...fields });
    expect(id).toMatch(/^loc_[a-f0-9]{12}$/);
    const [claim, loc] = tx()[0]!;
    expect(claim!.Put).toMatchObject({ Item: { pk: "LOCCODE", sk: "MD1", locationId: id }, ConditionExpression: "attribute_not_exists(pk)" });
    expect(loc!.Put!.Item).toMatchObject({ pk: "LOC", sk: id, locationId: id, code: "MD1", type: "warehouse" });
  });

  it("refuses a code another location already has", async () => {
    ddb.on(TransactWriteCommand).rejects(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    await expect(store.createLocation({ code: "MD1", ...fields })).rejects.toMatchObject({ code: "code_taken" });
  });

  it("updates details without touching the ID or code", async () => {
    await store.updateLocation(US_ID, { ...fields, gln: "0614141000005", accountNumber: "C-1042" });
    const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(input.Key).toEqual({ pk: "LOC", sk: US_ID });
    expect(Object.values(input.ExpressionAttributeNames!)).not.toContain("code");
    expect(Object.values(input.ExpressionAttributeNames!)).not.toContain("locationId");
    expect(input.ExpressionAttributeValues![":contact"]).toEqual(fields.contact);
    expect(input.ConditionExpression).toBe("attribute_exists(pk)");
  });

  it("removes optional details left blank", async () => {
    await store.updateLocation(US_ID, { ...fields, gln: undefined, accountNumber: undefined });
    const expr = ddb.commandCalls(UpdateCommand)[0]!.args[0].input.UpdateExpression!;
    expect(expr).toMatch(/REMOVE .*#gln/);
    expect(expr).toMatch(/REMOVE .*#accountNumber/);
    expect(expr).toMatch(/REMOVE .*#receivingNotes/);
  });

  it("gives a GTIN to one SKU only", async () => {
    await store.setItemGtin("SUP-IP6-CAP240", "00036000291452");
    const items = tx()[0]!;
    expect(items[0]!.Put).toMatchObject({ Item: { pk: "GTIN", sk: "00036000291452", sku: "SUP-IP6-CAP240" }, ConditionExpression: "attribute_not_exists(pk)" });
    ddb.reset();
    ddb.on(GetCommand).resolves({});
    ddb.on(TransactWriteCommand).rejects(Object.assign(new Error("cond"), { name: "TransactionCanceledException" }));
    await expect(store.setItemGtin("PET-IP6-PWD120", "00036000291452")).rejects.toMatchObject({ code: "gtin_taken" });
  });

  it("refuses to receive a scanned carton whose GTIN isn't this SKU's", async () => {
    world({});
    ddb.on(GetCommand, { Key: { pk: "ITEM", sk: "SUP-IP6-CAP240" } }).resolves({ Item: { sku: "SUP-IP6-CAP240", gtin: "00036000291452" } });
    await expect(store.receive({ sku: "SUP-IP6-CAP240", locationId: US_ID, lotNo: "A", expiresOn: "2028-01-01", qty: 1, actor: "x", scannedGtin: "00012345678905" })).rejects.toMatchObject({ code: "wrong_product" });
    await store.receive({ sku: "SUP-IP6-CAP240", locationId: US_ID, lotNo: "A", expiresOn: "2028-01-01", qty: 1, actor: "x", scannedGtin: "00036000291452" });
    expect(tx()).toHaveLength(1);
  });
});

describe("pure rules", () => {
  it("storefront availability counts only active locations that ship to a sellable country", () => {
    const s = summarize([pos({ available: 4 }), pos({ locationId: "loc_0f9e8d7c6b5a", available: 50 }), pos({ sku: "PET", available: -2, backorderLimit: 10 })], [us, eu], ["US"]);
    expect(s).toEqual([
      { sku: "SUP-IP6-CAP240", sellable: 4 },
      { sku: "PET", sellable: 8 },
    ]);
  });

  it("a count only changes the lots it lists, and flags lots not on record", () => {
    const rows = parseCountCsv("sku,location,lot,counted\nSUP-IP6-CAP240,md1,A,8\nSUP-IP6-CAP240,MD1,ZZZ,3\nSUP-IP6-CAP240,XX9,A,1\n");
    expect(diffCount(rows, [lot("A", 10, future(100))], [us, eu])).toEqual([
      { sku: "SUP-IP6-CAP240", code: "md1", locationId: "loc_a1b2c3d4e5f6", lotNo: "A", counted: 8, onHand: 10, delta: -2 },
      { sku: "SUP-IP6-CAP240", code: "MD1", locationId: "loc_a1b2c3d4e5f6", lotNo: "ZZZ", counted: 3, onHand: null, delta: 0, problem: "unknown_lot" },
      { sku: "SUP-IP6-CAP240", code: "XX9", locationId: null, lotNo: "A", counted: 1, onHand: null, delta: 0, problem: "unknown_location" },
    ]);
  });

  it("the daily report lists expired stock, lots expiring within 90 days and positions sold past their limit", () => {
    const r = dailyReport([pos({ available: -3, backorderLimit: 1 }), pos({ locationId: "loc_0f9e8d7c6b5a", available: -1, backorderLimit: 5 })], [lot("OLD", 2, "2020-01-01"), lot("SOON", 5, future(60)), lot("LATER", 5, future(200)), lot("EMPTY", 0, "2020-01-01")]);
    expect(r.expired.map((l) => l.lotNo)).toEqual(["OLD"]);
    expect(r.expiringSoon.map((l) => l.lotNo)).toEqual(["SOON"]);
    expect(r.belowZero.map((p) => p.locationId)).toEqual(["loc_a1b2c3d4e5f6"]);
  });
});

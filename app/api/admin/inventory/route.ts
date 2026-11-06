import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { products } from "@/content/products";
import { refreshCatalog } from "@/lib/data/catalog";
import { checkLowStock } from "@/lib/inventory/alerts";
import { diffCount, parseCountCsv } from "@/lib/inventory/count";
import { adjust, allStock, InventoryError, receive, saveLocation, setPositionSettings, transfer } from "@/lib/inventory/store";

export const runtime = "nodejs";

const SKUS = new Set(products.flatMap((p) => p.variants.map((v) => v.sku)));
const sku = z.string().refine((s) => SKUS.has(s), "unknown sku");
const id = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,39}$/);
const lotNo = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._/-]+$/);
const reason = z.string().trim().min(3).max(300);
const qty = z.number().int().min(1).max(1_000_000);

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("location"),
    locationId: id,
    name: z.string().trim().min(2).max(80),
    countries: z.array(z.string().regex(/^(\*|[A-Z]{2})$/)).min(1).max(250),
    priority: z.number().int().min(0).max(1000),
    active: z.boolean(),
  }),
  z.object({ action: z.literal("receive"), sku, locationId: id, lotNo, expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), qty, reason: z.string().trim().max(300).optional() }),
  z.object({
    action: z.literal("adjust"),
    sku,
    locationId: id,
    lotNo,
    delta: z.number().int().min(-1_000_000).max(1_000_000).refine((n) => n !== 0),
    type: z.enum(["damage", "expired", "correction"]),
    reason,
  }),
  z.object({ action: z.literal("transfer"), sku, from: id, to: id, lotNo, qty, reason: z.string().trim().max(300).optional() }),
  z.object({
    action: z.literal("settings"),
    sku,
    locationId: id,
    safetyStock: z.number().int().min(0).max(1_000_000),
    lowStockThreshold: z.number().int().min(0).max(1_000_000),
    backorderLimit: z.number().int().min(0).max(1_000_000),
  }),
  z.object({ action: z.literal("count"), csv: z.string().max(200_000), apply: z.boolean(), reason }),
]);

const ERRORS: Record<InventoryError["code"], number> = { not_enough_stock: 409, no_location: 409, unknown_location: 400, lot_short: 409, invalid: 400 };

/** Every inventory change staff can make. Each is validated, applied in a transaction and written to the audit log. */
export const POST = withAdmin("inventory:write", async (req, staff) => {
  const b = await parseBody(req, Body);
  const actor = staff.user.email;
  try {
    switch (b.action) {
      case "location":
        await saveLocation({ locationId: b.locationId, name: b.name, countries: b.countries, priority: b.priority, active: b.active });
        await audit(staff.actor, "inventory.location", b.locationId, { countries: b.countries.join(" "), active: b.active }, staff.ip);
        break;
      case "receive":
        await receive({ sku: b.sku, locationId: b.locationId, lotNo: b.lotNo, expiresOn: b.expiresOn, qty: b.qty, actor, reason: b.reason });
        await audit(staff.actor, "inventory.receive", b.sku, { location: b.locationId, lot: b.lotNo, qty: b.qty }, staff.ip);
        break;
      case "adjust":
        await adjust({ sku: b.sku, locationId: b.locationId, lotNo: b.lotNo, delta: b.delta, type: b.type, actor, reason: b.reason });
        await audit(staff.actor, `inventory.${b.type}`, b.sku, { location: b.locationId, lot: b.lotNo, delta: b.delta }, staff.ip);
        await checkLowStock([b.sku]);
        break;
      case "transfer":
        await transfer({ sku: b.sku, from: b.from, to: b.to, lotNo: b.lotNo, qty: b.qty, actor, reason: b.reason });
        await audit(staff.actor, "inventory.transfer", b.sku, { from: b.from, to: b.to, lot: b.lotNo, qty: b.qty }, staff.ip);
        await checkLowStock([b.sku]);
        break;
      case "settings":
        await setPositionSettings(b.sku, b.locationId, { safetyStock: b.safetyStock, lowStockThreshold: b.lowStockThreshold, backorderLimit: b.backorderLimit });
        await audit(
          staff.actor,
          "inventory.settings",
          b.sku,
          { location: b.locationId, safety: b.safetyStock, alert: b.lowStockThreshold, backorder: b.backorderLimit },
          staff.ip,
        );
        break;
      case "count": {
        const rows = parseCountCsv(b.csv);
        if (!rows.length || rows.length > 2000) throw new HttpError(400, "invalid_request");
        const lines = diffCount(rows, (await allStock()).lots);
        if (!b.apply) return NextResponse.json({ lines });
        if (lines.some((l) => l.problem)) throw new HttpError(400, "invalid_request");
        for (const l of lines.filter((x) => x.delta !== 0)) {
          await adjust({ sku: l.sku, locationId: l.locationId, lotNo: l.lotNo, delta: l.delta, type: "count", actor, reason: b.reason });
        }
        await audit(staff.actor, "inventory.count", undefined, { lines: lines.length, changed: lines.filter((x) => x.delta !== 0).length }, staff.ip);
        await checkLowStock(lines.map((l) => l.sku));
        refreshCatalog();
        return NextResponse.json({ lines, applied: true });
      }
    }
  } catch (err) {
    if (err instanceof InventoryError) throw new HttpError(ERRORS[err.code], err.code);
    const name = (err as Error).name;
    if (name === "ConditionalCheckFailedException" || name === "TransactionCanceledException") throw new HttpError(409, "stock_changed");
    throw err;
  }
  refreshCatalog();
  return NextResponse.json({ ok: true });
});

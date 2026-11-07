import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { products } from "@/content/products";
import { refreshCatalog } from "@/lib/data/catalog";
import { checkLowStock } from "@/lib/inventory/alerts";
import { diffCount, parseCountCsv } from "@/lib/inventory/count";
import { adjust, allStock, createLocation, InventoryError, listLocations, receive, setItemGtin, setPositionSettings, transfer, updateLocation } from "@/lib/inventory/store";
import { isGln, normalizeGtin, parseGs1 } from "@/lib/inventory/gs1";
import { toE164 } from "@/lib/phone";

export const runtime = "nodejs";

const SKUS = new Set(products.flatMap((p) => p.variants.map((v) => v.sku)));
const sku = z.string().refine((s) => SKUS.has(s), "unknown sku");
/** System-made location IDs (lib/inventory/store.ts createLocation). */
const id = z.string().regex(/^loc_[a-f0-9]{12}$/);
// GS1 AI (10) allows up to 20 characters.
const lotNo = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9._/-]+$/);
const reason = z.string().trim().min(3).max(300);
const qty = z.number().int().min(1).max(1_000_000);
const optional = (max: number) => z.string().trim().max(max).optional().transform((s) => s || undefined);

const LocationFields = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["warehouse", "3pl", "store"]),
  address: z.object({
    line1: z.string().trim().min(2).max(120),
    line2: optional(120),
    city: z.string().trim().min(1).max(80),
    region: optional(80),
    postalCode: optional(20),
    country: z.string().regex(/^[A-Z]{2}$/),
  }),
  gln: z
    .string()
    .trim()
    .optional()
    .transform((s) => s || undefined)
    .refine((s) => s === undefined || isGln(s), "not a valid GLN"),
  operator: z.object({ company: z.string().trim().min(2).max(120), phone: z.string().trim().min(5).max(40) }),
  contact: z.object({
    name: z.string().trim().min(2).max(120),
    role: optional(80),
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    phone: z.string().trim().min(5).max(40),
  }),
  accountNumber: optional(60),
  receivingNotes: optional(1000),
  countries: z.array(z.string().regex(/^(\*|[A-Z]{2})$/)).min(1).max(250),
  priority: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

/** Phone numbers are stored in E.164; ones written without + are read in the location's country. */
function withPhones<T extends z.infer<typeof LocationFields>>(loc: T): T {
  const operatorPhone = toE164(loc.operator.phone, loc.address.country);
  const contactPhone = toE164(loc.contact.phone, loc.address.country);
  if (!operatorPhone || !contactPhone) throw new HttpError(400, "invalid_phone", [...(operatorPhone ? [] : ["operator.phone"]), ...(contactPhone ? [] : ["contact.phone"])]);
  return { ...loc, operator: { ...loc.operator, phone: operatorPhone }, contact: { ...loc.contact, phone: contactPhone } };
}

const Body = z.discriminatedUnion("action", [
  LocationFields.extend({ action: z.literal("location"), code: z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]{1,11}$/)) }),
  LocationFields.extend({ action: z.literal("location_update"), locationId: id }),
  z.object({ action: z.literal("item"), sku, gtin: z.string().trim().max(20) }),
  z.object({
    action: z.literal("receive"),
    sku,
    locationId: id,
    lotNo,
    expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    qty,
    reason: z.string().trim().max(300).optional(),
    /** The carton's GS1 barcode as scanned, when staff scanned one. */
    scan: z.string().max(200).optional(),
  }),
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

const ERRORS: Record<InventoryError["code"], number> = {
  not_enough_stock: 409,
  no_location: 409,
  unknown_location: 400,
  lot_short: 409,
  invalid: 400,
  code_taken: 409,
  gtin_taken: 409,
  wrong_product: 409,
};

/** Every inventory change staff can make. Each is validated, applied in a transaction and written to the audit log. */
export const POST = withAdmin("inventory:write", async (req, staff) => {
  const b = await parseBody(req, Body);
  const actor = staff.user.email;
  try {
    switch (b.action) {
      case "location": {
        const { action: _a, ...loc } = b;
        const locationId = await createLocation(withPhones(loc));
        await audit(staff.actor, "inventory.location.create", locationId, { code: b.code, type: b.type, country: b.address.country, countries: b.countries.join(" "), active: b.active }, staff.ip);
        refreshCatalog();
        return NextResponse.json({ ok: true, locationId });
      }
      case "location_update": {
        const { action: _a, locationId, ...loc } = b;
        await updateLocation(locationId, withPhones(loc));
        await audit(staff.actor, "inventory.location.update", locationId, { type: b.type, country: b.address.country, countries: b.countries.join(" "), active: b.active }, staff.ip);
        break;
      }
      case "item": {
        const gtin = b.gtin ? normalizeGtin(b.gtin) : null;
        if (b.gtin && !gtin) throw new HttpError(400, "invalid_gtin", ["gtin"]);
        await setItemGtin(b.sku, gtin);
        await audit(staff.actor, "inventory.item", b.sku, { gtin: gtin ?? "removed" }, staff.ip);
        break;
      }
      case "receive": {
        // The server reads the barcode itself; the form's lot and expiry must be what the carton says.
        let scannedGtin: string | undefined;
        if (b.scan) {
          const s = parseGs1(b.scan);
          if (!s?.gtin) throw new HttpError(400, "invalid_scan");
          if ((s.lot && s.lot !== b.lotNo) || (s.expiresOn && s.expiresOn !== b.expiresOn)) throw new HttpError(400, "scan_mismatch");
          scannedGtin = s.gtin;
        }
        await receive({ sku: b.sku, locationId: b.locationId, lotNo: b.lotNo, expiresOn: b.expiresOn, qty: b.qty, actor, reason: b.reason, scannedGtin });
        await audit(staff.actor, "inventory.receive", b.sku, { location: b.locationId, lot: b.lotNo, qty: b.qty, scanned: Boolean(b.scan) }, staff.ip);
        break;
      }
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
        if (!rows.length || rows.length > 2000) throw new HttpError(400, "invalid_request", ["csv"]);
        const [{ lots }, locations] = await Promise.all([allStock(), listLocations()]);
        const lines = diffCount(rows, lots, locations);
        if (!b.apply) return NextResponse.json({ lines });
        if (lines.some((l) => l.problem)) throw new HttpError(400, "invalid_request");
        for (const l of lines.filter((x) => x.delta !== 0)) {
          await adjust({ sku: l.sku, locationId: l.locationId!, lotNo: l.lotNo, delta: l.delta, type: "count", actor, reason: b.reason });
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

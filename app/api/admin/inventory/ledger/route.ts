import { NextResponse } from "next/server";
import { withAdmin, HttpError } from "@/lib/admin/guard";
import { toCsv } from "@/lib/admin/csv";
import { audit } from "@/lib/data/audit";
import { products } from "@/content/products";
import { ledger } from "@/lib/inventory/store";

export const runtime = "nodejs";

const SKUS = new Set(products.flatMap((p) => p.variants.map((v) => v.sku)));

/** The full movement log for one SKU as a CSV (for accounting and audits). */
export const GET = withAdmin("orders:export", async (req, staff) => {
  const sku = new URL(req.url).searchParams.get("sku") ?? "";
  if (!SKUS.has(sku)) throw new HttpError(404, "not_found");
  const rows = await ledger(sku, 10_000);
  await audit(staff.actor, "inventory.export", sku, { rows: rows.length }, staff.ip);
  const csv = toCsv(
    ["at", "sku", "location", "lot", "type", "qty", "order", "by", "reason"],
    rows.map((m) => [m.at, m.sku, m.locationId, m.lotNo ?? "", m.type, m.qty, m.orderId ?? "", m.actor, m.reason ?? ""]),
  );
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="inventory-${sku}.csv"` } });
});

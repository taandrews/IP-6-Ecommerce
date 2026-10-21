import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { setInventory } from "@/lib/data/catalog";
import { products } from "@/content/products";

export const runtime = "nodejs";

const Body = z.object({
  stock: z.number().int().min(-100_000).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(100_000),
  allowBackorder: z.boolean(),
});

export const PUT = withAdmin<{ sku: string }>("inventory:write", async (req, staff, { sku }) => {
  if (!products.some((p) => p.variants.some((v) => v.sku === sku))) throw new HttpError(404, "not_found");
  const b = await parseBody(req, Body);
  await setInventory(sku, b, staff.user.email);
  await audit(staff.actor, "inventory.set", sku, { stock: b.stock, backorder: b.allowBackorder }, staff.ip);
  return NextResponse.json({ ok: true });
});

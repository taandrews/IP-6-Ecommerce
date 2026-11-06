import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { saveVariantPricing } from "@/lib/data/catalog";
import { products } from "@/content/products";

export const runtime = "nodejs";

/** Prices in minor units (cents). $1 to $10,000 per unit keeps typos from going live. */
const Price = z.number().int().min(100).max(1_000_000);

const Body = z.object({
  prices: z.object({ USD: Price, CAD: Price, GBP: Price, AUD: Price, EUR: Price, INR: z.number().int().min(100).max(100_000_000) }),
  available: z.boolean(),
});

export const PUT = withAdmin<{ sku: string; variantId: string }>("products:write", async (req, staff, { sku, variantId }) => {
  const product = products.find((p) => p.sku === sku);
  const variant = product?.variants.find((v) => v.id === variantId);
  if (!product || !variant) throw new HttpError(404, "not_found");
  const b = await parseBody(req, Body);
  await saveVariantPricing(sku, variantId, b.prices, b.available, staff.user.email);
  await audit(staff.actor, "product.price", variant.sku, { usd: b.prices.USD, available: b.available }, staff.ip);
  return NextResponse.json({ ok: true });
});

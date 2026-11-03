import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalogFresh } from "@/lib/data/catalog";
import { createCheckout, type CheckoutLine } from "@/lib/shopify/storefront";
import { limitByIp } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/client-ip";

export const runtime = "nodejs";

/** Most units of one item in a single order (matches the cart's limit). */
const MAX_PER_ITEM = 20;

const Body = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1).max(80),
        qty: z.number().int().min(1).max(MAX_PER_ITEM),
        cycleDays: z.number().int().positive().max(366).optional(),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * Turns the site's cart into a Shopify cart and returns Shopify's hosted
 * checkout URL. Only catalog IDs come from the browser: the Shopify variant
 * and selling plan for each line are looked up here, and Shopify prices the
 * order itself (discounts, tax, shipping), so nothing the browser sends can
 * change what is charged.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "checkout", 20)) ?? (await limitByIp(req, "checkout-hour", 120, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Your cart couldn't be read. Please refresh and try again." }, { status: 400 });

  const catalog = await getCatalogFresh();
  const variants = new Map(catalog.flatMap((p) => p.variants.map((v) => [v.id, { product: p, variant: v }] as const)));
  const qtyByVariant = new Map<string, number>();
  const lines: CheckoutLine[] = [];
  for (const line of parsed.data.lines) {
    const hit = variants.get(line.variantId);
    if (!hit?.variant.shopifyVariantId || !hit.variant.inStock) {
      return NextResponse.json({ error: `${hit?.product.name ?? "An item in your cart"} is not available right now. Please remove it and try again.` }, { status: 409 });
    }
    const total = (qtyByVariant.get(line.variantId) ?? 0) + line.qty;
    if (total > MAX_PER_ITEM) return NextResponse.json({ error: `You can order up to ${MAX_PER_ITEM} of each item.` }, { status: 400 });
    qtyByVariant.set(line.variantId, total);
    let sellingPlanId: string | undefined;
    if (line.cycleDays) {
      sellingPlanId = hit.product.subscriptionCycles.find((c) => c.days === line.cycleDays)?.sellingPlanId;
      if (!sellingPlanId) return NextResponse.json({ error: "That subscription option is no longer offered. Please remove it and add it again." }, { status: 409 });
    }
    lines.push({ merchandiseId: hit.variant.shopifyVariantId, quantity: line.qty, ...(sellingPlanId ? { sellingPlanId } : {}) });
  }

  try {
    const url = await createCheckout(lines, clientIpFrom(req.headers) || undefined);
    if (new URL(url).protocol !== "https:") throw new Error("Unexpected checkout URL");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout] shopify cart failed", (err as Error).name, (err as Error).message.slice(0, 200));
    return NextResponse.json({ error: "Checkout is unavailable right now. Please try again in a minute." }, { status: 502 });
  }
}

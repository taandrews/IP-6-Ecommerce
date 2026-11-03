import type { Product } from "@/types";
import { pricesFromUsd } from "@/content/products";
import type { ShopifyProduct } from "@/lib/shopify/storefront";

/**
 * Applies Shopify's live price, stock and subscription plans to the static
 * catalog, matching variants by SKU. A variant Shopify doesn't return is shown
 * but can't be bought. Pure, so tests can use it.
 */
export function mergeCatalog(base: Product[], shopify: ShopifyProduct[]): Product[] {
  const bySku = new Map(shopify.flatMap((p) => p.variants.map((v) => [v.sku, { product: p, variant: v }] as const)));
  return base.map((p) => {
    const plans = p.variants.map((v) => bySku.get(v.sku)?.product.sellingPlans).find((sp) => sp?.length) ?? [];
    return {
      ...p,
      subscriptionCycles: plans.map((sp) => ({ days: sp.days, discountPct: sp.discountPct, sellingPlanId: sp.id })),
      variants: p.variants.map((v) => {
        const hit = bySku.get(v.sku);
        if (!hit) return { ...v, inStock: false, shopifyVariantId: undefined };
        return {
          ...v,
          priceCents: pricesFromUsd(hit.variant.priceCents),
          inStock: hit.variant.availableForSale,
          shopifyVariantId: hit.variant.id,
        };
      }),
    };
  });
}

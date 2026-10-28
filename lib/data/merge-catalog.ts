import type { Currency, Product } from "@/types";
import type { InventoryItem, ProductOverride } from "@/types/records";

/** Applies admin price and availability overrides and live stock to the static catalog. Pure, so scripts and tests can use it. */
export function mergeCatalog(base: Product[], overrides: ProductOverride[], stock: InventoryItem[]): Product[] {
  const bySku = new Map(overrides.map((o) => [o.sku, o]));
  const stockBySku = new Map(stock.map((s) => [s.sku, s]));
  return base.map((p) => {
    const o = bySku.get(p.sku);
    return {
      ...p,
      variants: p.variants.map((v) => {
        const prices = o?.prices?.[v.id];
        const manual = o?.available?.[v.id];
        const inv = stockBySku.get(v.sku);
        const hasStock = !inv || inv.stock > 0 || inv.allowBackorder;
        return {
          ...v,
          priceCents: prices ? { ...v.priceCents, ...stripUndefined(prices) } : v.priceCents,
          inStock: v.inStock && manual !== false && hasStock,
        };
      }),
    };
  });
}

function stripUndefined(p: Partial<Record<Currency, number>>): Partial<Record<Currency, number>> {
  return Object.fromEntries(Object.entries(p).filter(([, n]) => typeof n === "number" && Number.isFinite(n)));
}

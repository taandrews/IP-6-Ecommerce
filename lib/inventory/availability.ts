import type { Location, Position } from "./store";

/** How many units of a SKU can be sold now: tracked SKUs only. */
export interface StockSummary {
  sku: string;
  /** Sum over active locations that ship to a sellable country of available plus the backorder allowance. */
  sellable: number;
}

/**
 * Pure: storefront availability from the inventory positions. A SKU with no
 * position anywhere is untracked and isn't listed (it sells as before).
 * Checkout still holds stock per destination (lib/inventory/store.ts), so
 * this only decides what the shop shows.
 */
export function summarize(positions: Position[], locations: Location[], sellableCountries: readonly string[]): StockSummary[] {
  const shipping = new Set(
    locations.filter((l) => l.active && (l.countries.includes("*") || l.countries.some((c) => sellableCountries.includes(c)))).map((l) => l.locationId),
  );
  const bySku = new Map<string, number>();
  for (const p of positions) {
    const add = shipping.has(p.locationId) ? Math.max(0, p.available + p.backorderLimit) : 0;
    bySku.set(p.sku, (bySku.get(p.sku) ?? 0) + add);
  }
  return [...bySku].map(([sku, sellable]) => ({ sku, sellable }));
}

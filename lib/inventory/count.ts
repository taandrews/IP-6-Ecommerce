import type { Lot } from "./store";

export interface CountRow {
  sku: string;
  locationId: string;
  lotNo: string;
  counted: number;
}

export interface CountLine extends CountRow {
  onHand: number | null;
  delta: number;
  problem?: "unknown_lot" | "bad_number";
}

/**
 * Pure: compares a stock count (from a warehouse export or a shelf count)
 * with the lots on record. Lots on record but missing from the count are
 * left alone: a count only covers what it lists.
 */
export function diffCount(rows: CountRow[], lots: Lot[]): CountLine[] {
  const byKey = new Map(lots.map((l) => [`${l.sku}|${l.locationId}|${l.lotNo}`, l]));
  return rows.map((r) => {
    if (!Number.isInteger(r.counted) || r.counted < 0) return { ...r, onHand: null, delta: 0, problem: "bad_number" as const };
    const lot = byKey.get(`${r.sku}|${r.locationId}|${r.lotNo}`);
    if (!lot) return { ...r, onHand: null, delta: 0, problem: "unknown_lot" as const };
    return { ...r, onHand: lot.onHand, delta: r.counted - lot.onHand };
  });
}

/** Parses "sku,location,lot,counted" lines (a header row is skipped). */
export function parseCountCsv(text: string): CountRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter((c) => c.length >= 4 && !/^sku$/i.test(c[0]!))
    .map(([sku, locationId, lotNo, counted]) => ({ sku: sku!, locationId: locationId!, lotNo: lotNo!, counted: Number(counted) }));
}

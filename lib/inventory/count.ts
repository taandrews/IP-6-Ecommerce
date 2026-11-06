import type { Location, Lot } from "./store";

export interface CountRow {
  sku: string;
  /** The location's code as staff and warehouses write it (e.g. MD1). */
  code: string;
  lotNo: string;
  counted: number;
}

export interface CountLine extends CountRow {
  locationId: string | null;
  onHand: number | null;
  delta: number;
  problem?: "unknown_location" | "unknown_lot" | "bad_number";
}

/**
 * Pure: compares a stock count (from a warehouse export or a shelf count)
 * with the lots on record. Lots on record but missing from the count are
 * left alone: a count only covers what it lists.
 */
export function diffCount(rows: CountRow[], lots: Lot[], locations: Location[]): CountLine[] {
  const idByCode = new Map(locations.map((l) => [l.code.toUpperCase(), l.locationId]));
  const byKey = new Map(lots.map((l) => [`${l.sku}|${l.locationId}|${l.lotNo}`, l]));
  return rows.map((r) => {
    const locationId = idByCode.get(r.code.toUpperCase()) ?? null;
    if (!Number.isInteger(r.counted) || r.counted < 0) return { ...r, locationId, onHand: null, delta: 0, problem: "bad_number" as const };
    if (!locationId) return { ...r, locationId, onHand: null, delta: 0, problem: "unknown_location" as const };
    const lot = byKey.get(`${r.sku}|${locationId}|${r.lotNo}`);
    if (!lot) return { ...r, locationId, onHand: null, delta: 0, problem: "unknown_lot" as const };
    return { ...r, locationId, onHand: lot.onHand, delta: r.counted - lot.onHand };
  });
}

/** Parses "sku,location,lot,counted" lines, location being the location code (a header row is skipped). */
export function parseCountCsv(text: string): CountRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter((c) => c.length >= 4 && !/^sku$/i.test(c[0]!))
    .map(([sku, code, lotNo, counted]) => ({ sku: sku!, code: code!, lotNo: lotNo!, counted: Number(counted) }));
}

import "server-only";
import { EMAIL } from "@/lib/email-addresses";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { claimLowStockAlert, listLocations, skuStock, type Location, type Lot, type Position } from "./store";

/** How staff see a location in emails and reports: "Name (CODE)". */
export function locationLabels(locations: Location[]): Map<string, string> {
  return new Map(locations.map((l) => [l.locationId, `${l.name} (${l.code})`]));
}

/** Emails the orders@ group when a position drops to its low-stock threshold (at most once a day per position). */
export async function checkLowStock(skus: string[]) {
  const names = locationLabels(await listLocations());
  for (const sku of new Set(skus)) {
    const { positions } = await skuStock(sku);
    for (const p of positions) {
      if (p.lowStockThreshold <= 0 || p.available > p.lowStockThreshold) continue;
      if (!(await claimLowStockAlert(sku, p.locationId))) continue;
      await sendEmailSafe(EMAIL.orders, emailTemplates.lowStockAlert(sku, names.get(p.locationId) ?? p.locationId, p.available, p.lowStockThreshold), "low stock alert");
    }
  }
}

export interface DailyReport {
  expiringSoon: Lot[];
  expired: Lot[];
  belowZero: Position[];
}

const DAY = 24 * 3600 * 1000;

/** Lots expiring within 90 days or already expired with stock left, and positions sold beyond their backorder limit. */
export function dailyReport(positions: Position[], lots: Lot[], at = new Date()): DailyReport {
  const todayIso = at.toISOString().slice(0, 10);
  const soonIso = new Date(at.getTime() + 90 * DAY).toISOString().slice(0, 10);
  return {
    expired: lots.filter((l) => l.onHand > 0 && l.expiresOn < todayIso),
    expiringSoon: lots.filter((l) => l.onHand > 0 && l.expiresOn >= todayIso && l.expiresOn <= soonIso),
    belowZero: positions.filter((p) => p.available < -p.backorderLimit),
  };
}

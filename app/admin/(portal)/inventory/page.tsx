import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { products } from "@/content/products";
import { allStock, ledger, listLocations, type Lot, type Movement, type Position } from "@/lib/inventory/store";
import { dailyReport } from "@/lib/inventory/alerts";
import { Notice, PageHeader } from "@/components/admin/ui";
import { InventoryClient } from "./InventoryClient";

export const metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const staff = await requireStaffPage("orders:read");
  const variants = products.flatMap((p) => p.variants.map((v) => ({ sku: v.sku, label: `${p.name} · ${[v.name, v.size].filter(Boolean).join(" · ")}` })));
  let positions: Position[] = [];
  let lots: Lot[] = [];
  let locations: Awaited<ReturnType<typeof listLocations>> = [];
  const recent: Record<string, Movement[]> = {};
  let error = false;
  try {
    [{ positions, lots }, locations] = await Promise.all([allStock(), listLocations()]);
    const logs = await Promise.all(variants.map((v) => ledger(v.sku, 25)));
    variants.forEach((v, i) => (recent[v.sku] = logs[i]!));
  } catch (err) {
    console.error("[admin] inventory failed", (err as Error).name);
    error = true;
  }
  const report = dailyReport(positions, lots);
  const untracked = variants.filter((v) => !positions.some((p) => p.sku === v.sku));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        intro="Stock per location and lot. Checkout holds stock while a shopper pays; payment turns the hold into a sale from the lot that expires first. Every change is logged with who made it and why."
      />
      {error ? <Notice tone="bad">Inventory couldn&apos;t be loaded. Check that the Stock table is deployed.</Notice> : null}
      {!locations.length ? <Notice tone="warn">Add a location (your warehouse or fulfilment partner) before receiving stock.</Notice> : null}
      {untracked.length ? (
        <Notice tone="warn">
          Not tracked yet, so these sell without a stock limit: {untracked.map((v) => v.sku).join(", ")}. Receive their stock to start tracking.
        </Notice>
      ) : null}
      {report.expired.length ? <Notice tone="bad">Expired lots still in stock (never sold; write them off): {report.expired.map((l) => `${l.sku} ${l.lotNo} at ${l.locationId}`).join(", ")}.</Notice> : null}
      {report.expiringSoon.length ? <Notice tone="warn">Expiring within 90 days: {report.expiringSoon.map((l) => `${l.sku} ${l.lotNo} (${l.expiresOn})`).join(", ")}.</Notice> : null}
      <InventoryClient
        variants={variants}
        locations={locations}
        positions={positions}
        lots={lots}
        recent={recent}
        canWrite={can(staff.role, "inventory:write")}
        canExport={can(staff.role, "orders:export")}
      />
    </div>
  );
}

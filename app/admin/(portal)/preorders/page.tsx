import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listRecentOrders, OPEN_STATUSES } from "@/lib/data/orders";
import { getPreorderSettingsFresh } from "@/lib/data/settings";
import { orderRow } from "@/lib/admin/views";
import { Notice, PageHeader, Panel, Table } from "@/components/admin/ui";
import { OrdersTable } from "../orders/OrdersClient";
import { PreorderSettingsForm } from "./PreorderSettingsForm";

export const metadata = { title: "Pre-orders" };

export default async function PreordersPage() {
  const staff = await requireStaffPage("orders:read");
  const settings = await getPreorderSettingsFresh();
  let open: Awaited<ReturnType<typeof listRecentOrders>> = [];
  let error = false;
  try {
    open = (await listRecentOrders(OPEN_STATUSES, 500)).filter((o) => o.preorder === "1");
  } catch (err) {
    console.error("[admin] preorders failed", (err as Error).name);
    error = true;
  }
  const bySku = new Map<string, { name: string; units: number; orders: number }>();
  for (const o of open) {
    for (const l of o.items.filter((x) => x.preorder)) {
      const cur = bySku.get(l.sku) ?? { name: `${l.name} · ${l.variantLabel}`, units: 0, orders: 0 };
      cur.units += l.qty;
      cur.orders += 1;
      bySku.set(l.sku, cur);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pre-orders" intro="Paid pre-orders that haven't shipped yet, and the store-wide pre-order switch." />
      {error ? <Notice tone="bad">Pre-orders couldn't be loaded.</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title={`Waiting to ship (${open.length} orders)`}>
            {bySku.size ? (
              <Table head={["SKU", "Product", "Units", "Orders"]} minWidth={480}>
                {[...bySku].map(([sku, v]) => (
                  <tr key={sku}>
                    <td className="px-4 py-2 font-mono text-xs">{sku}</td>
                    <td className="px-4 py-2">{v.name}</td>
                    <td className="px-4 py-2 tabular-nums">{v.units}</td>
                    <td className="px-4 py-2 tabular-nums">{v.orders}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-ink/60">Nothing waiting.</p>
            )}
          </Panel>
          <OrdersTable rows={open.map((o) => orderRow(o, staff.role))} />
        </div>
        <Panel title="Pre-order settings">
          {can(staff.role, "preorder:manage") ? (
            <PreorderSettingsForm initial={settings} />
          ) : (
            <dl className="text-sm space-y-1">
              <div className="flex justify-between"><dt>Status</dt><dd>{settings.active ? "On" : "Off"}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd>{settings.discountPct}%</dd></div>
              <div><dt className="text-ink/60">Shipping note</dt><dd>{settings.shipNote}</dd></div>
            </dl>
          )}
        </Panel>
      </div>
    </div>
  );
}

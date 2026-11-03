import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { getPreorderSettingsFresh } from "@/lib/data/settings";
import { recentOrders } from "@/lib/shopify/admin";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";
import { ShopifyOrdersTable } from "../orders/ShopifyOrdersTable";
import { PreorderSettingsForm } from "./PreorderSettingsForm";

export const metadata = { title: "Pre-orders" };

export default async function PreordersPage() {
  const staff = await requireStaffPage("orders:read");
  const settings = await getPreorderSettingsFresh();
  let open: Awaited<ReturnType<typeof recentOrders>> = [];
  let error = false;
  try {
    open = await recentOrders(100, "fulfillment_status:unfulfilled status:open");
  } catch (err) {
    console.error("[admin] preorders failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-orders"
        intro="The pre-order switch turns the Shopify automatic discount on or off and sets its percentage, so the price on this site and the price at checkout always match."
      />
      {error ? <Notice tone="bad">Orders couldn&apos;t be loaded from Shopify.</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title={`Waiting to ship (${open.length})`}>
          <ShopifyOrdersTable orders={open} />
        </Panel>
        <Panel title="Pre-order settings">
          {can(staff.role, "preorder:manage") ? (
            <PreorderSettingsForm initial={settings} />
          ) : (
            <dl className="text-sm space-y-1">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd>{settings.active ? "On" : "Off"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>{settings.discountPct}%</dd>
              </div>
              <div>
                <dt className="text-ink/60">Shipping note</dt>
                <dd>{settings.shipNote}</dd>
              </div>
            </dl>
          )}
        </Panel>
      </div>
    </div>
  );
}

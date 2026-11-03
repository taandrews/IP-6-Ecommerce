import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listReviewsByStatus } from "@/lib/data/reviews";
import { listPrivacyRequests } from "@/lib/data/privacy";
import { overview, recentOrders, SHOPIFY_ADMIN_URL } from "@/lib/shopify/admin";
import { Notice, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { ShopifyOrdersTable } from "./orders/ShopifyOrdersTable";

export const metadata = { title: "Dashboard" };

async function safe<T>(p: Promise<T>, fallback: T): Promise<{ value: T; ok: boolean }> {
  try {
    return { value: await p, ok: true };
  } catch (err) {
    console.error("[admin] dashboard read failed", (err as Error).name);
    return { value: fallback, ok: false };
  }
}

export default async function AdminDashboard(props: { searchParams: Promise<{ denied?: string }> }) {
  const searchParams = await props.searchParams;
  const staff = await requireStaffPage("dashboard:read");
  const canOrders = can(staff.role, "orders:read");
  const [stats, orders, pendingReviews, privacy] = await Promise.all([
    canOrders ? safe(overview(), null) : Promise.resolve({ value: null, ok: true }),
    canOrders ? safe(recentOrders(8), []) : Promise.resolve({ value: [], ok: true }),
    safe(listReviewsByStatus("pending", undefined, 100), { reviews: [], cursor: undefined }),
    can(staff.role, "privacy:manage") ? safe(listPrivacyRequests("open"), []) : Promise.resolve({ value: [], ok: true }),
  ]);
  const anyFailed = [stats, orders, pendingReviews, privacy].some((r) => !r.ok);
  const s = stats.value;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        intro="Sales figures come from Shopify, where orders, refunds, subscriptions and discounts are managed. Test orders are left out of the totals."
        actions={
          canOrders ? (
            <a className="btn-secondary text-sm" href={SHOPIFY_ADMIN_URL} target="_blank" rel="noopener noreferrer">
              Open Shopify admin
            </a>
          ) : null
        }
      />
      {searchParams.denied ? <Notice tone="warn">Your role doesn&apos;t include that page.</Notice> : null}
      {anyFailed ? <Notice tone="bad">Some figures couldn&apos;t be loaded. Shopify or the data tables didn&apos;t respond; try again in a minute.</Notice> : null}

      {s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Sales, 30 days" value={formatPrice(s.revenue30dCents, "USD")} hint={`${s.orders30d} order${s.orders30d === 1 ? "" : "s"}`} />
          <Stat label="To ship" value={s.unfulfilled} hint="Open, unfulfilled orders" href="/admin/orders?f=unfulfilled" />
          <Stat label="Customers" value={s.customers} hint="In Shopify" href="/admin/customers" />
          <Stat label="Active subscriptions" value={s.activeSubscriptions ?? "In Shopify"} hint="Shopify Subscriptions app" />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Reviews waiting" value={pendingReviews.value.reviews.length} href={can(staff.role, "reviews:moderate") ? "/admin/reviews" : undefined} />
        {can(staff.role, "privacy:manage") ? <Stat label="Privacy requests open" value={privacy.value.length} hint="Due within 30 days" href="/admin/privacy" /> : null}
      </div>

      {canOrders ? (
        <Panel title="Latest orders">
          <ShopifyOrdersTable orders={orders.value} />
        </Panel>
      ) : null}
    </div>
  );
}

import { requireStaffPage } from "@/lib/admin/guard";
import { recentOrders, SHOPIFY_ADMIN_URL } from "@/lib/shopify/admin";
import { Notice, PageHeader } from "@/components/admin/ui";
import { ShopifyOrdersTable } from "./ShopifyOrdersTable";

export const metadata = { title: "Orders" };

const FILTERS = {
  all: { label: "All", query: undefined },
  unfulfilled: { label: "To ship", query: "fulfillment_status:unfulfilled status:open" },
  fulfilled: { label: "Shipped", query: "fulfillment_status:shipped" },
  refunded: { label: "Refunded", query: "financial_status:refunded OR financial_status:partially_refunded" },
} as const;

type FilterKey = keyof typeof FILTERS;

export default async function OrdersPage(props: { searchParams: Promise<{ f?: string; q?: string }> }) {
  await requireStaffPage("orders:read");
  const searchParams = await props.searchParams;
  const f: FilterKey = searchParams.f && searchParams.f in FILTERS ? (searchParams.f as FilterKey) : "all";
  // Order numbers only in the URL, never emails: "#1003" or "1003".
  const num = searchParams.q?.replace(/[^0-9]/g, "").slice(0, 10);
  const query = [FILTERS[f].query, num ? `name:#${num}` : undefined].filter(Boolean).join(" ") || undefined;
  let orders: Awaited<ReturnType<typeof recentOrders>> = [];
  let error = false;
  try {
    orders = await recentOrders(50, query);
  } catch (err) {
    console.error("[admin] shopify orders failed", (err as Error).name);
    error = true;
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        intro="Orders are placed through Shopify checkout. Open one to fulfill, refund, cancel or print a packing slip in Shopify."
        actions={
          <a className="btn-secondary text-sm" href={`${SHOPIFY_ADMIN_URL}/orders`} target="_blank" rel="noopener noreferrer">
            Orders in Shopify
          </a>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <a
            key={k}
            href={`/admin/orders?f=${k}`}
            className={`rounded-full px-3 py-1 text-sm border ${k === f ? "bg-navy-800 text-surface border-navy-800" : "border-cloud-300 text-ink/75"}`}
          >
            {FILTERS[k].label}
          </a>
        ))}
        <form className="ml-auto flex gap-2" role="search">
          <input type="hidden" name="f" value={f} />
          <label htmlFor="order-num" className="sr-only">
            Order number
          </label>
          <input id="order-num" name="q" className="input w-40" placeholder="Order #" inputMode="numeric" defaultValue={num ?? ""} />
          <button className="btn-secondary text-sm">Find</button>
        </form>
      </div>
      {error ? <Notice tone="bad">Shopify didn&apos;t respond. Try again in a minute.</Notice> : <ShopifyOrdersTable orders={orders} />}
    </div>
  );
}

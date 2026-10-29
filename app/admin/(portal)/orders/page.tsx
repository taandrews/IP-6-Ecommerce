import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listOrdersByStatus, listRecentOrders, OPEN_STATUSES } from "@/lib/data/orders";
import { orderRow, STATUS_LABEL } from "@/lib/admin/views";
import { Notice, PageHeader } from "@/components/admin/ui";
import { ORDER_STATUSES, type OrderStatus } from "@/types/records";
import { OrderSearch, OrdersTable } from "./OrdersClient";
import { ExportForm } from "./ExportForm";

export const metadata = { title: "Orders" };

const TABS: Array<{ key: string; label: string; statuses: OrderStatus[] }> = [
  { key: "open", label: "To ship", statuses: OPEN_STATUSES },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "refunds", label: "Refunds and cancellations", statuses: ["partially_refunded", "refunded", "cancelled"] },
  { key: "all", label: "All recent", statuses: ORDER_STATUSES.filter((s) => s !== "pending" && s !== "failed") },
];

export default async function OrdersPage(
  props: { searchParams: Promise<{ tab?: string; status?: string; cursor?: string }> }
) {
  const searchParams = await props.searchParams;
  const staff = await requireStaffPage("orders:read");
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0]!;
  const single = searchParams.status && ORDER_STATUSES.includes(searchParams.status as OrderStatus) ? (searchParams.status as OrderStatus) : null;

  let rows: ReturnType<typeof orderRow>[] = [];
  let cursor: string | undefined;
  let error = false;
  try {
    if (single) {
      const page = await listOrdersByStatus(single, searchParams.cursor, 50);
      rows = page.orders.map((o) => orderRow(o, staff.role));
      cursor = page.cursor;
    } else {
      rows = (await listRecentOrders(tab.statuses, 100)).map((o) => orderRow(o, staff.role));
    }
  } catch (err) {
    console.error("[admin] orders list failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        intro="Newest first. Open an order to ship it, add tracking, refund or cancel."
        actions={can(staff.role, "orders:export") ? <ExportForm /> : undefined}
      />
      <nav aria-label="Order views" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders?tab=${t.key}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${!single && t.key === tab.key ? "bg-navy-800 text-surface border-navy-800" : "bg-surface border-cloud-300 text-ink/80"}`}
          >
            {t.label}
          </Link>
        ))}
        {single ? <span className="rounded-full border px-3 py-1.5 text-sm bg-navy-800 text-surface">{STATUS_LABEL[single]}</span> : null}
      </nav>
      <OrderSearch />
      {error ? <Notice tone="bad">Orders couldn't be loaded. Check the Orders table and its indexes are deployed.</Notice> : <OrdersTable rows={rows} />}
      {single && cursor ? (
        <Link className="btn-secondary text-sm" href={`/admin/orders?status=${single}&cursor=${encodeURIComponent(cursor)}`}>
          Older orders
        </Link>
      ) : null}
    </div>
  );
}

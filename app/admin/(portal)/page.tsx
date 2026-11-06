import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { getDailyStats, lastNDays } from "@/lib/data/analytics";
import { listOrdersByStatus } from "@/lib/data/orders";
import { listInventory } from "@/lib/data/catalog";
import { listReviewsByStatus } from "@/lib/data/reviews";
import { listPrivacyRequests } from "@/lib/data/privacy";
import { Notice, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

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
  const days = lastNDays(30);
  const [stats, paid, processing, stock, pendingReviews, privacy] = await Promise.all([
    safe(getDailyStats(days), []),
    safe(listOrdersByStatus("paid", undefined, 100), { orders: [], cursor: undefined }),
    safe(listOrdersByStatus("processing", undefined, 100), { orders: [], cursor: undefined }),
    safe(listInventory(), []),
    safe(listReviewsByStatus("pending", undefined, 100), { reviews: [], cursor: undefined }),
    can(staff.role, "privacy:manage") ? safe(listPrivacyRequests("open"), []) : Promise.resolve({ value: [], ok: true }),
  ]);
  const anyFailed = [stats, paid, processing, stock, pendingReviews, privacy].some((r) => !r.ok);

  const s = stats.value;
  const sum = (from: number, pick: (d: (typeof s)[number]) => number) => s.slice(from).reduce((n, d) => n + pick(d), 0);
  const revenue = (from: number) => {
    const out: Partial<Record<Currency, number>> = {};
    for (const d of s.slice(from)) for (const [c, v] of Object.entries(d.revenue)) out[c as Currency] = (out[c as Currency] ?? 0) + (v ?? 0);
    return out;
  };
  const fmtRevenue = (r: Partial<Record<Currency, number>>) =>
    Object.keys(r).length ? Object.entries(r).map(([c, v]) => formatPrice(v ?? 0, c as Currency)).join(" · ") : formatPrice(0, "USD");
  const open = [...paid.value.orders, ...processing.value.orders];
  const openPreorders = open.filter((o) => o.preorder === "1").length;
  const low = stock.value.filter((i) => i.stock <= i.lowStockThreshold && !i.allowBackorder);
  const maxUsd = Math.max(1, ...s.map((d) => d.revenue.USD ?? 0));
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" intro="Last 30 days. Times are UTC." />
      {searchParams.denied ? <Notice tone="warn">Your role doesn't include that page.</Notice> : null}
      {anyFailed ? <Notice tone="bad">Some figures couldn't be loaded. Check that the data tables are deployed.</Notice> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sales today" value={fmtRevenue(revenue(29))} hint={n(sum(29, (d) => d.orders), "order")} />
        <Stat label="Sales, 7 days" value={fmtRevenue(revenue(23))} hint={n(sum(23, (d) => d.orders), "order")} />
        <Stat label="Sales, 30 days" value={fmtRevenue(revenue(0))} hint={`${n(sum(0, (d) => d.orders), "order")} · ${n(sum(0, (d) => d.units), "unit")}`} />
        <Stat label="Pre-orders, 30 days" value={sum(0, (d) => d.preorders)} hint={`${openPreorders} waiting to ship`} href="/admin/preorders" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="To ship" value={open.length} hint="Paid or preparing" href="/admin/orders" />
        <Stat label="Low stock" value={low.length} hint={low.map((i) => i.sku).join(", ") || "All above threshold"} href="/admin/products" />
        <Stat label="Reviews waiting" value={pendingReviews.value.reviews.length} href={can(staff.role, "reviews:moderate") ? "/admin/reviews" : undefined} />
        {can(staff.role, "privacy:manage") ? <Stat label="Privacy requests open" value={privacy.value.length} hint="Due within 30 days" href="/admin/privacy" /> : null}
      </div>

      <Panel title="Daily sales (USD)">
        <div className="flex items-end gap-1 h-40" role="img" aria-label="Bar chart of daily USD sales for the last 30 days">
          {s.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col justify-end h-full group relative">
              <div className="bg-navy-800/80 rounded-t" style={{ height: `${((d.revenue.USD ?? 0) / maxUsd) * 100}%`, minHeight: d.orders ? 2 : 0 }} />
              <span className="sr-only">
                {d.date}: {formatPrice(d.revenue.USD ?? 0, "USD")}, {d.orders} orders
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink/55">
          <span>{s[0]?.date}</span>
          <span>{s[s.length - 1]?.date}</span>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
            <tr>
              <th className="py-2">Day</th>
              <th className="py-2 text-right">Orders</th>
              <th className="py-2 text-right">Pre-orders</th>
              <th className="py-2 text-right">Sales</th>
              <th className="py-2 text-right">Refunds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cloud-300">
            {[...s].reverse().slice(0, 14).map((d) => (
              <tr key={d.date}>
                <td className="py-2">{d.date}</td>
                <td className="py-2 text-right tabular-nums">{d.orders}</td>
                <td className="py-2 text-right tabular-nums">{d.preorders}</td>
                <td className="py-2 text-right tabular-nums">{fmtRevenue(d.revenue)}</td>
                <td className="py-2 text-right tabular-nums">{Object.keys(d.refunds).length ? fmtRevenue(d.refunds) : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

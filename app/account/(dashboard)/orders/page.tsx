import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth/session";
import { getMyOrders, ORDER_STATUS_LABEL } from "@/lib/data/myorders";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account/login?next=/account/orders");
  let orders: Awaited<ReturnType<typeof getMyOrders>> = [];
  let failed = false;
  try {
    orders = await getMyOrders(user);
  } catch (err) {
    console.error("[account] orders failed", (err as Error).name);
    failed = true;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-2">Orders</p>
        <h2 className="font-display text-display-md text-forest-800">Order history</h2>
        {!user.emailVerified ? (
          <p className="text-sm text-ink/60 mt-2">Orders placed before you had an account appear once your email is verified.</p>
        ) : null}
      </header>

      {failed ? (
        <div className="card p-10 text-center">
          <p className="text-ink/70">We couldn't load your orders right now. Please try again shortly.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink/70 mb-4">You haven't placed any orders yet.</p>
          <Link href="/shop" className="btn-primary">Shop the collection</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-ivory-200 text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} className="border-t border-ivory-300">
                  <td className="px-4 py-3">
                    <Link href={`/account/orders/${o.orderId}`} className="text-forest-700 underline">
                      {o.orderId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">{ORDER_STATUS_LABEL[o.status]}</td>
                  <td className="px-4 py-3">{o.items.reduce((n, l) => n + l.qty, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(o.totalCents, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

// NOTE: In production, fetch from DynamoDB using the authenticated userId.
// This placeholder renders an empty state until real auth + data are wired.
async function fetchOrders(): Promise<
  Array<{
    orderId: string;
    status: string;
    totalCents: number;
    currency: "USD";
    createdAt: string;
    itemCount: number;
  }>
> {
  return [];
}

export default async function OrdersPage() {
  const orders = await fetchOrders();

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-2">Orders</p>
        <h2 className="font-display text-display-md text-forest-800">Order history</h2>
      </header>

      {orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink/70 mb-4">You haven't placed any orders yet.</p>
          <Link href="/shop" className="btn-primary">Shop the collection</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
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
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3">{o.itemCount}</td>
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

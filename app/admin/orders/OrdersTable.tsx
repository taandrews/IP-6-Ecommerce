"use client";

import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/lib/utils";

type AdminOrder = {
  orderId: string;
  customer: string;
  email: string;
  status: string;
  totalCents: number;
  currency: "USD" | "CAD" | "GBP" | "AUD" | "EUR" | "INR";
  itemCount: number;
  createdAt: string;
};

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
      setLoading(false);
    })();
  }, []);

  async function updateStatus(orderId: string, next: string) {
    setOrders((os) => os.map((o) => (o.orderId === orderId ? { ...o, status: next } : o)));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  const filtered = orders.filter((o) => {
    const matchesQuery =
      !query ||
      o.orderId.toLowerCase().includes(query.toLowerCase()) ||
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.email.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || o.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order #, customer, email…"
          className="input max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input max-w-[200px]"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ivory-200 text-left">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/60">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/60">No orders match.</td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.orderId} className="border-t border-ivory-300 align-top">
                  <td className="px-4 py-3 font-medium">{o.orderId}</td>
                  <td className="px-4 py-3">
                    <div>{o.customer}</div>
                    <div className="text-xs text-ink/60">{o.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.orderId, e.target.value)}
                      className="input py-1.5 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{o.itemCount}</td>
                  <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(o.totalCents, o.currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { adminRequest } from "@/components/admin/client";
import { Empty, Pill, Table } from "@/components/admin/ui";
import type { OrderStatus } from "@/types/records";
import type { Currency } from "@/types";

interface Row {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  customer: string;
  email: string;
  items: number;
  totalCents: number;
  currency: Currency;
  preorder: boolean;
  country: string;
}

const LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  partially_refunded: "Part refunded",
  refunded: "Refunded",
  failed: "Failed",
};
const TONE: Record<OrderStatus, "neutral" | "good" | "warn" | "bad" | "info"> = {
  pending: "neutral",
  paid: "warn",
  processing: "info",
  shipped: "good",
  delivered: "good",
  cancelled: "neutral",
  partially_refunded: "bad",
  refunded: "bad",
  failed: "bad",
};

export function OrdersTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty>No orders here yet.</Empty>;
  return (
    <Table head={["Order", "Placed (UTC)", "Customer", "Items", "Total", "Status"]} minWidth={760}>
      {rows.map((r) => (
        <tr key={r.orderId} className="hover:bg-cloud-100/60">
          <td className="px-4 py-3 font-medium">
            <Link href={`/admin/orders/${r.orderId}`} className="text-navy-800 underline underline-offset-2">
              {r.orderId}
            </Link>
            {r.preorder ? <span className="ml-2"><Pill tone="info">Pre-order</Pill></span> : null}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">{r.createdAt.slice(0, 16).replace("T", " ")}</td>
          <td className="px-4 py-3">
            <div>{r.customer}</div>
            <div className="text-xs text-ink/55">{r.email} · {r.country}</div>
          </td>
          <td className="px-4 py-3 tabular-nums">{r.items}</td>
          <td className="px-4 py-3 tabular-nums">{formatPrice(r.totalCents, r.currency)}</td>
          <td className="px-4 py-3"><Pill tone={TONE[r.status]}>{LABEL[r.status]}</Pill></td>
        </tr>
      ))}
    </Table>
  );
}

export function OrderSearch() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await adminRequest<{ orders: Row[] }>("/api/admin/orders/search", "POST", { q });
      setRows(data.orders);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={run} className="flex flex-wrap gap-2" role="search">
        <label htmlFor="order-search" className="sr-only">Order number or customer email</label>
        <input
          id="order-search"
          className="input max-w-md"
          placeholder="Order number (IP6-…) or customer email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <button className="btn-secondary text-sm" disabled={busy || q.trim().length < 3}>Search</button>
        {rows ? (
          <button type="button" className="btn-ghost text-sm" onClick={() => { setRows(null); setQ(""); }}>
            Clear
          </button>
        ) : null}
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {rows ? (
        <div>
          <p className="text-sm text-ink/65 mb-2">{rows.length} result{rows.length === 1 ? "" : "s"}</p>
          <OrdersTable rows={rows} />
        </div>
      ) : null}
    </div>
  );
}

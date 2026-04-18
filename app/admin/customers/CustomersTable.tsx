"use client";

import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/lib/utils";

interface Customer {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  ltvCents: number;
  createdAt: string;
}

export function CustomersTable() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setRows(data.customers ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customers…"
        className="input max-w-sm mb-6"
      />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ivory-200 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Lifetime value</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/60">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/60">No customers yet.</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.userId} className="border-t border-ivory-300">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.orderCount}</td>
                  <td className="px-4 py-3">{formatPrice(r.ltvCents)}</td>
                  <td className="px-4 py-3">{formatDate(r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

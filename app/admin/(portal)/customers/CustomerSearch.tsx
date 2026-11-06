"use client";

import Link from "next/link";
import { useState } from "react";
import { adminRequest } from "@/components/admin/client";
import { Table } from "@/components/admin/ui";

interface Row {
  name: string;
  email: string;
  k: string;
  account: boolean;
  createdAt?: string;
}

export function CustomerSearch() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setRows((await adminRequest<{ customers: Row[] }>("/api/admin/customers/search", "POST", { q })).customers);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={run} className="flex flex-wrap gap-2" role="search">
        <label htmlFor="cust-search" className="sr-only">Customer email</label>
        <input id="cust-search" className="input max-w-md" placeholder="Email, or the start of one" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <button className="btn-secondary text-sm" disabled={busy || q.trim().length < 2}>Find</button>
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {rows ? (
        rows.length ? (
          <Table head={["Name", "Email", "Type", ""]} minWidth={560}>
            {rows.map((r) => (
              <tr key={r.k}>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.account ? "Account" : "Guest checkout"}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline text-navy-800" href={`/admin/customers/view?k=${encodeURIComponent(r.k)}`}>View</Link>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-ink/60">No customer found. Guest checkouts need the full email address.</p>
        )
      ) : null}
    </div>
  );
}

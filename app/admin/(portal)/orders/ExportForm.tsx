"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/** Owner-only CSV export of a date range. The file contains personal data. */
export function ExportForm() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  return (
    <form action="/api/admin/orders/export" method="get" className="flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col text-xs text-ink/60">
        From
        <input type="date" name="from" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="input py-1.5" required />
      </label>
      <label className="flex flex-col text-xs text-ink/60">
        To
        <input type="date" name="to" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="input py-1.5" required />
      </label>
      <button className="btn-secondary text-sm" title="Downloads customer names and addresses. Store the file securely and delete it when done.">
        <Download className="size-4" /> Export CSV
      </button>
    </form>
  );
}

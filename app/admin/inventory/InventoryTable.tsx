"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  sku: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
}

export function InventoryTable({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);

  async function update(sku: string, stock: number) {
    setRows((r) => r.map((row) => (row.sku === sku ? { ...row, stock } : row)));
    await fetch(`/api/admin/inventory/${sku}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ivory-200 text-left">
          <tr>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Threshold</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const low = r.stock <= r.lowStockThreshold;
            return (
              <tr key={r.sku} className="border-t border-ivory-300">
                <td className="px-4 py-3 font-mono text-xs">{r.sku}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={r.stock}
                    onChange={(e) => update(r.sku, Number(e.target.value))}
                    className="input py-1.5 w-24"
                  />
                </td>
                <td className="px-4 py-3">{r.lowStockThreshold}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                      low ? "bg-red-50 text-danger ring-1 ring-red-200" : "bg-forest-50 text-forest-700 ring-1 ring-forest-200",
                    )}
                  >
                    {low ? <AlertTriangle className="size-3" /> : null}
                    {low ? "Low stock" : "Healthy"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

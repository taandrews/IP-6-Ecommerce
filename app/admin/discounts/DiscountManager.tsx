"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DiscountCode } from "@/types";
import { Input, Select } from "@/components/ui/Input";

export function DiscountManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/discounts");
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes ?? []);
      }
    })();
  }, []);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      code: String(form.get("code") ?? "").toUpperCase(),
      type: form.get("type"),
      value: Number(form.get("value")),
      maxUses: form.get("maxUses") ? Number(form.get("maxUses")) : undefined,
      expiresAt: form.get("expiresAt") || undefined,
      active: true,
    };
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { code } = await res.json();
      setCodes((cs) => [code, ...cs]);
      e.currentTarget.reset();
    }
  }

  async function remove(code: string) {
    await fetch(`/api/admin/discounts/${code}`, { method: "DELETE" });
    setCodes((cs) => cs.filter((c) => c.code !== code));
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <form onSubmit={create} className="card p-6 space-y-4 h-fit">
        <h2 className="font-display text-lg text-forest-800">Create a code</h2>
        <Input id="d-code" name="code" label="Code" required maxLength={40} />
        <Select id="d-type" name="type" label="Type" required defaultValue="percentage">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount (cents)</option>
        </Select>
        <Input id="d-value" name="value" label="Value" type="number" min={1} required />
        <Input id="d-maxUses" name="maxUses" label="Max uses (optional)" type="number" min={1} />
        <Input id="d-expiresAt" name="expiresAt" label="Expiry (optional)" type="date" />
        <button type="submit" className="btn-primary w-full">Create</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ivory-200 text-left">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/60">No codes yet.</td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.code} className="border-t border-ivory-300">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3">
                    {c.type === "percentage" ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.usesCount}/{c.maxUses ?? "∞"}
                  </td>
                  <td className="px-4 py-3">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(c.code)}
                      aria-label={`Delete ${c.code}`}
                      className="p-1.5 hover:bg-ivory-200 rounded"
                    >
                      <Trash2 className="size-4 text-ink/60" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

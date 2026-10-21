"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import type { PreorderSettings } from "@/types/records";

export function PreorderSettingsForm({ initial }: { initial: PreorderSettings }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (initial.active && !v.active && !window.confirm("Turn pre-orders off? The discount stops applying to new orders right away.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await adminRequest("/api/admin/settings/preorder", "PUT", v);
      setMsg({ ok: true, text: "Saved. The store shows the change within a few minutes; checkout uses it immediately." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
        <span className="font-medium">Pre-orders are open</span>
      </label>
      <label className="block">
        <span className="label">Discount on one-time items (%)</span>
        <input className="input" type="number" min={0} max={50} required value={v.discountPct} onChange={(e) => setV({ ...v, discountPct: Number(e.target.value) })} />
      </label>
      <label className="block">
        <span className="label">Label</span>
        <input className="input" required minLength={2} maxLength={30} value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} />
      </label>
      <label className="block">
        <span className="label">Shipping note shown to customers</span>
        <input className="input" required minLength={5} maxLength={120} value={v.shipNote} onChange={(e) => setV({ ...v, shipNote: e.target.value })} />
      </label>
      {msg ? <p role="status" className={msg.ok ? "text-emerald-700" : "text-danger"}>{msg.text}</p> : null}
      <button className="btn-primary text-sm" disabled={busy}>Save</button>
    </form>
  );
}

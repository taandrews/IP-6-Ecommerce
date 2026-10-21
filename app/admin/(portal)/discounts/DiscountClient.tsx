"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Panel } from "@/components/admin/ui";

export function DiscountCreate() {
  const router = useRouter();
  const [f, setF] = useState({ code: "", type: "percentage", value: "10", currency: "USD", min: "", maxUses: "", perCustomer: "1", startsAt: "", expiresAt: "", description: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const value = f.type === "percentage" ? Number(f.value) : Math.round(Number(f.value) * 100);
      await adminRequest("/api/admin/discounts", "POST", {
        code: f.code,
        type: f.type,
        value,
        ...(f.type === "fixed" ? { currency: f.currency } : {}),
        ...(f.min ? { minSubtotalCents: Math.round(Number(f.min) * 100) } : {}),
        ...(f.maxUses ? { maxUses: Number(f.maxUses) } : {}),
        ...(f.perCustomer ? { perCustomerLimit: Number(f.perCustomer) } : {}),
        ...(f.startsAt ? { startsAt: new Date(f.startsAt).toISOString() } : {}),
        ...(f.expiresAt ? { expiresAt: new Date(f.expiresAt).toISOString() } : {}),
        ...(f.description ? { description: f.description } : {}),
      });
      setMsg({ ok: true, text: `Code ${f.code.toUpperCase()} created.` });
      setF({ ...f, code: "", description: "" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="New code">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <label className="block"><span className="label">Code</span><input className="input uppercase" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_\-]+" value={f.code} onChange={set("code")} /></label>
        <label className="block">
          <span className="label">Type</span>
          <select className="input" value={f.type} onChange={set("type")}>
            <option value="percentage">Percent off</option>
            <option value="fixed">Amount off</option>
          </select>
        </label>
        <label className="block"><span className="label">{f.type === "percentage" ? "Percent (1-100)" : "Amount"}</span><input className="input" required inputMode="decimal" value={f.value} onChange={set("value")} /></label>
        {f.type === "fixed" ? (
          <label className="block">
            <span className="label">Currency</span>
            <select className="input" value={f.currency} onChange={set("currency")}>
              {["USD", "CAD", "GBP", "AUD", "EUR", "INR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        ) : <div className="hidden lg:block" />}
        <label className="block"><span className="label">Minimum order (optional)</span><input className="input" inputMode="decimal" value={f.min} onChange={set("min")} /></label>
        <label className="block"><span className="label">Total uses (optional)</span><input className="input" inputMode="numeric" value={f.maxUses} onChange={set("maxUses")} /></label>
        <label className="block"><span className="label">Uses per customer</span><input className="input" inputMode="numeric" value={f.perCustomer} onChange={set("perCustomer")} /></label>
        <label className="block"><span className="label">Note (internal)</span><input className="input" maxLength={120} value={f.description} onChange={set("description")} /></label>
        <label className="block"><span className="label">Starts (optional)</span><input className="input" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} /></label>
        <label className="block"><span className="label">Ends (optional)</span><input className="input" type="datetime-local" value={f.expiresAt} onChange={set("expiresAt")} /></label>
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
          <button className="btn-primary text-sm" disabled={busy}>Create code</button>
          {msg ? <span role="status" className={msg.ok ? "text-emerald-700" : "text-danger"}>{msg.text}</span> : null}
        </div>
      </form>
    </Panel>
  );
}

export function DiscountRowActions({ code, active, used }: { code: string; active: boolean; used: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/admin/discounts/${encodeURIComponent(code)}`;
  async function act(method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await adminRequest(url, method, body);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button className="btn-ghost text-xs" disabled={busy} onClick={() => act("PATCH", { action: active ? "deactivate" : "activate" })}>
        {active ? "Pause" : "Activate"}
      </button>
      <button className="btn-ghost text-xs" disabled={busy} onClick={() => window.confirm(`End ${code} now?`) && act("PATCH", { action: "expire" })}>
        End now
      </button>
      {!used ? (
        <button className="btn-ghost text-xs text-danger" disabled={busy} onClick={() => window.confirm(`Delete ${code}?`) && act("DELETE")}>
          Delete
        </button>
      ) : null}
      {error ? <span className="w-full text-right text-xs text-danger">{error}</span> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Pill } from "@/components/admin/ui";
import type { Currency } from "@/types";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

export function VariantEditor(props: {
  productSku: string;
  variant: { id: string; sku: string; label: string; prices: Record<Currency, number>; inStock: boolean };
  manualAvailable: boolean;
  canPrice: boolean;
}) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<Currency, string>>(
    Object.fromEntries(CURRENCIES.map((c) => [c, (props.variant.prices[c] / 100).toFixed(2)])) as Record<Currency, string>,
  );
  const [available, setAvailable] = useState(props.manualAvailable);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function savePricing(e: React.FormEvent) {
    e.preventDefault();
    const cents = Object.fromEntries(CURRENCIES.map((c) => [c, Math.round(Number(prices[c]) * 100)])) as Record<Currency, number>;
    if (Object.values(cents).some((n) => !Number.isFinite(n) || n < 100)) {
      setMsg({ ok: false, text: "Every price must be at least 1.00." });
      return;
    }
    const changedUsd = cents.USD !== props.variant.prices.USD;
    if (changedUsd && !window.confirm(`Change the US price to $${(cents.USD / 100).toFixed(2)}? New orders use it right away.`)) return;
    await run(() => adminRequest(`/api/admin/products/${encodeURIComponent(props.productSku)}/${encodeURIComponent(props.variant.id)}`, "PUT", { prices: cents, available }), "Prices saved.");
  }

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-navy-800">{props.variant.label}</h3>
          <span className="font-mono text-xs text-ink/55">{props.variant.sku}</span>
          {props.variant.inStock ? <Pill tone="good">On sale</Pill> : <Pill tone="bad">Not available</Pill>}
        </div>
        <form onSubmit={savePricing} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map((c) => (
              <label key={c} className="text-xs text-ink/60">
                {c}
                <input
                  className="input py-1.5 text-sm"
                  inputMode="decimal"
                  value={prices[c]}
                  disabled={!props.canPrice}
                  onChange={(e) => setPrices({ ...prices, [c]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} disabled={!props.canPrice} onChange={(e) => setAvailable(e.target.checked)} />
            Available to buy
          </label>
          {props.canPrice ? <button className="btn-secondary text-sm" disabled={busy}>Save prices</button> : <p className="text-xs text-ink/55">Only owners can change prices.</p>}
        </form>
      </div>
      <div className="space-y-2 text-sm">
        <p className="font-medium text-navy-800">Stock</p>
        <p className="text-ink/70">Stock is kept per warehouse and batch, with holds at checkout and a full movement log.</p>
        <Link href={`/admin/inventory#${encodeURIComponent(props.variant.sku)}`} className="btn-secondary text-sm inline-block">Manage stock</Link>
      </div>
      {msg ? <p role="status" className={`lg:col-span-2 text-sm ${msg.ok ? "text-emerald-700" : "text-danger"}`}>{msg.text}</p> : null}
    </div>
  );
}

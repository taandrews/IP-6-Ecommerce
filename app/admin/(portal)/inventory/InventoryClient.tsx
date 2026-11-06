"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Empty, Panel, Pill, Table } from "@/components/admin/ui";
import type { Location, Lot, Movement, Position } from "@/lib/inventory/store";

type Variant = { sku: string; label: string };

const TYPE_LABEL: Record<Movement["type"], string> = {
  receive: "Received",
  sale: "Sold",
  return: "Returned",
  damage: "Damaged",
  expired: "Expired",
  count: "Count",
  correction: "Correction",
  transfer_out: "Transfer out",
  transfer_in: "Transfer in",
};

function useAction() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminRequest<Record<string, unknown>>("/api/admin/inventory", "POST", body);
      setMsg({ ok: true, text: ok });
      router.refresh();
      return res;
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
      return null;
    } finally {
      setBusy(false);
    }
  }
  const status = msg ? <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-danger"}`}>{msg.text}</p> : null;
  return { run, busy, status };
}

const int = (s: string) => (/^-?\d+$/.test(s.trim()) ? Number(s) : NaN);

export function InventoryClient(props: {
  variants: Variant[];
  locations: Location[];
  positions: Position[];
  lots: Lot[];
  recent: Record<string, Movement[]>;
  canWrite: boolean;
  canExport: boolean;
}) {
  const locName = useMemo(() => new Map(props.locations.map((l) => [l.locationId, l.name])), [props.locations]);
  return (
    <div className="space-y-6">
      <Locations locations={props.locations} canWrite={props.canWrite} />
      {props.canWrite && props.locations.length ? <Actions variants={props.variants} locations={props.locations} lots={props.lots} /> : null}
      {props.variants.map((v) => (
        <SkuPanel
          key={v.sku}
          variant={v}
          positions={props.positions.filter((p) => p.sku === v.sku)}
          lots={props.lots.filter((l) => l.sku === v.sku && l.onHand > 0)}
          recent={props.recent[v.sku] ?? []}
          locName={locName}
          canWrite={props.canWrite}
          canExport={props.canExport}
        />
      ))}
      {props.canWrite ? <Count /> : null}
    </div>
  );
}

function Locations({ locations, canWrite }: { locations: Location[]; canWrite: boolean }) {
  const { run, busy, status } = useAction();
  const [form, setForm] = useState({ locationId: "", name: "", countries: "US", priority: "10", active: true });
  return (
    <Panel title="Locations">
      {locations.length ? (
        <Table head={["Location", "Ships to", "Priority", "Status"]}>
          {locations.map((l) => (
            <tr key={l.locationId} className="border-t border-cloud-300">
              <td className="px-4 py-2">
                {l.name} <span className="font-mono text-xs text-ink/55">{l.locationId}</span>
              </td>
              <td className="px-4 py-2 text-sm">{l.countries.includes("*") ? "Anywhere" : l.countries.join(", ")}</td>
              <td className="px-4 py-2">{l.priority}</td>
              <td className="px-4 py-2">{l.active ? <Pill tone="good">Active</Pill> : <Pill tone="neutral">Off</Pill>}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>No locations yet.</Empty>
      )}
      {canWrite ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-5 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const countries = form.countries.split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase());
            run({ action: "location", locationId: form.locationId.trim().toLowerCase(), name: form.name, countries, priority: int(form.priority), active: form.active }, "Location saved.");
          }}
        >
          <label className="text-xs text-ink/60">
            ID (lowercase, e.g. us-east)
            <input className="input py-1.5 text-sm" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} required />
          </label>
          <label className="text-xs text-ink/60">
            Name
            <input className="input py-1.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="text-xs text-ink/60">
            Ships to (country codes, or *)
            <input className="input py-1.5 text-sm" value={form.countries} onChange={(e) => setForm({ ...form, countries: e.target.value })} required />
          </label>
          <label className="text-xs text-ink/60">
            Priority (lower ships first)
            <input className="input py-1.5 text-sm" inputMode="numeric" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <button className="btn-secondary text-sm" disabled={busy}>Save location</button>
          </div>
          <div className="sm:col-span-5">{status}</div>
        </form>
      ) : null}
    </Panel>
  );
}

function Actions({ variants, locations, lots }: { variants: Variant[]; locations: Location[]; lots: Lot[] }) {
  const { run, busy, status } = useAction();
  const [kind, setKind] = useState<"receive" | "adjust" | "transfer">("receive");
  const [f, setF] = useState({ sku: variants[0]?.sku ?? "", locationId: locations[0]?.locationId ?? "", to: locations[1]?.locationId ?? "", lotNo: "", expiresOn: "", qty: "", type: "damage", reason: "" });
  const lotOptions = lots.filter((l) => l.sku === f.sku && l.locationId === f.locationId && l.onHand > 0);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = int(f.qty);
    if (kind === "receive") run({ action: "receive", sku: f.sku, locationId: f.locationId, lotNo: f.lotNo.trim(), expiresOn: f.expiresOn, qty: n, reason: f.reason || undefined }, "Stock received.");
    if (kind === "adjust") run({ action: "adjust", sku: f.sku, locationId: f.locationId, lotNo: f.lotNo, delta: n, type: f.type, reason: f.reason }, "Stock adjusted.");
    if (kind === "transfer") run({ action: "transfer", sku: f.sku, from: f.locationId, to: f.to, lotNo: f.lotNo, qty: n, reason: f.reason || undefined }, "Stock transferred.");
  }

  return (
    <Panel title="Record a stock movement">
      <div className="flex gap-2 mb-4" role="tablist">
        {(["receive", "adjust", "transfer"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "btn-primary text-sm" : "btn-ghost text-sm"} onClick={() => setKind(k)}>
            {k === "receive" ? "Receive" : k === "adjust" ? "Adjust or write off" : "Transfer"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3 items-end">
        <label className="text-xs text-ink/60">
          Product
          <select className="input py-1.5 text-sm" value={f.sku} onChange={(e) => set("sku", e.target.value)}>
            {variants.map((v) => (
              <option key={v.sku} value={v.sku}>
                {v.label} ({v.sku})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink/60">
          {kind === "transfer" ? "From" : "Location"}
          <select className="input py-1.5 text-sm" value={f.locationId} onChange={(e) => set("locationId", e.target.value)}>
            {locations.map((l) => (
              <option key={l.locationId} value={l.locationId}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        {kind === "transfer" ? (
          <label className="text-xs text-ink/60">
            To
            <select className="input py-1.5 text-sm" value={f.to} onChange={(e) => set("to", e.target.value)}>
              {locations.map((l) => (
                <option key={l.locationId} value={l.locationId}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {kind === "receive" ? (
          <>
            <label className="text-xs text-ink/60">
              Lot number (from the label)
              <input className="input py-1.5 text-sm" value={f.lotNo} onChange={(e) => set("lotNo", e.target.value)} required />
            </label>
            <label className="text-xs text-ink/60">
              Expiry date
              <input type="date" className="input py-1.5 text-sm" value={f.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} required />
            </label>
          </>
        ) : (
          <label className="text-xs text-ink/60">
            Lot
            <select className="input py-1.5 text-sm" value={f.lotNo} onChange={(e) => set("lotNo", e.target.value)} required>
              <option value="">Choose a lot</option>
              {lotOptions.map((l) => (
                <option key={l.lotNo} value={l.lotNo}>
                  {l.lotNo} · {l.onHand} on hand · expires {l.expiresOn}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === "adjust" ? (
          <label className="text-xs text-ink/60">
            Type
            <select className="input py-1.5 text-sm" value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="damage">Damaged</option>
              <option value="expired">Expired (write off)</option>
              <option value="correction">Correction</option>
            </select>
          </label>
        ) : null}
        <label className="text-xs text-ink/60">
          {kind === "adjust" ? "Change (negative removes units)" : "Units"}
          <input className="input py-1.5 text-sm" inputMode="numeric" value={f.qty} onChange={(e) => set("qty", e.target.value)} required />
        </label>
        <label className="text-xs text-ink/60 sm:col-span-2">
          Reason or reference {kind === "adjust" ? "(required)" : "(optional, e.g. PO or shipment number)"}
          <input className="input py-1.5 text-sm" value={f.reason} onChange={(e) => set("reason", e.target.value)} required={kind === "adjust"} maxLength={300} />
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary text-sm" disabled={busy}>
            Save
          </button>
        </div>
        <div className="sm:col-span-3">{status}</div>
      </form>
    </Panel>
  );
}

function SkuPanel(props: { variant: Variant; positions: Position[]; lots: Lot[]; recent: Movement[]; locName: Map<string, string>; canWrite: boolean; canExport: boolean }) {
  const { variant, positions, lots, recent, locName } = props;
  const tracked = positions.length > 0;
  return (
    <section id={variant.sku} className="rounded-lg border border-cloud-300 bg-surface">
      <div className="border-b border-cloud-300 px-5 py-3 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h2 className="font-semibold text-navy-800">{variant.label}</h2>
          <p className="font-mono text-xs text-ink/55">{variant.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          {tracked ? null : <Pill tone="warn">Not tracked</Pill>}
          {props.canExport && tracked ? (
            <a className="btn-ghost text-sm" href={`/api/admin/inventory/ledger?sku=${encodeURIComponent(variant.sku)}`}>
              Export movements (CSV)
            </a>
          ) : null}
        </div>
      </div>
      <div className="p-5 space-y-5">
        {tracked ? (
          <Table head={["Location", "On hand", "Held at checkout", "Available", "Safety stock", "Alert at", "Backorder limit", ""]} minWidth={900}>
            {positions.map((p) => (
              <PositionRow key={p.locationId} p={p} name={locName.get(p.locationId) ?? p.locationId} canWrite={props.canWrite} />
            ))}
          </Table>
        ) : (
          <Empty>No stock received yet.</Empty>
        )}
        {lots.length ? (
          <Table head={["Lot", "Location", "On hand", "Expires", "Received"]}>
            {lots.map((l) => (
              <tr key={`${l.locationId}-${l.lotNo}`} className="border-t border-cloud-300">
                <td className="px-4 py-2 font-mono text-sm">{l.lotNo}</td>
                <td className="px-4 py-2">{locName.get(l.locationId) ?? l.locationId}</td>
                <td className="px-4 py-2">{l.onHand}</td>
                <td className="px-4 py-2">{l.expiresOn}</td>
                <td className="px-4 py-2 text-xs text-ink/60">{l.receivedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </Table>
        ) : null}
        {recent.length ? (
          <details>
            <summary className="cursor-pointer text-sm text-navy-800">Recent movements ({recent.length})</summary>
            <Table head={["When (UTC)", "Type", "Units", "Location", "Lot", "Order", "By", "Reason"]} minWidth={900}>
              {recent.map((m, i) => (
                <tr key={i} className="border-t border-cloud-300 text-sm">
                  <td className="px-4 py-2 whitespace-nowrap">{m.at.replace("T", " ").slice(0, 16)}</td>
                  <td className="px-4 py-2">{TYPE_LABEL[m.type]}</td>
                  <td className="px-4 py-2">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                  <td className="px-4 py-2">{locName.get(m.locationId) ?? m.locationId}</td>
                  <td className="px-4 py-2 font-mono">{m.lotNo ?? "Pending"}</td>
                  <td className="px-4 py-2 font-mono">{m.orderId ?? ""}</td>
                  <td className="px-4 py-2">{m.actor}</td>
                  <td className="px-4 py-2">{m.reason ?? ""}</td>
                </tr>
              ))}
            </Table>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function PositionRow({ p, name, canWrite }: { p: Position; name: string; canWrite: boolean }) {
  const { run, busy, status } = useAction();
  const [s, setS] = useState({ safety: String(p.safetyStock), alert: String(p.lowStockThreshold), backorder: String(p.backorderLimit) });
  const low = p.lowStockThreshold > 0 && p.available <= p.lowStockThreshold;
  const field = (k: keyof typeof s) =>
    canWrite ? <input className="input py-1 text-sm w-20" inputMode="numeric" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} aria-label={`${k} for ${name}`} /> : s[k];
  return (
    <tr className="border-t border-cloud-300">
      <td className="px-4 py-2">{name}</td>
      <td className="px-4 py-2">{p.onHand}</td>
      <td className="px-4 py-2">{p.reserved}</td>
      <td className="px-4 py-2">
        {p.available} {low ? <Pill tone="warn">Low</Pill> : null}
      </td>
      <td className="px-4 py-2">{field("safety")}</td>
      <td className="px-4 py-2">{field("alert")}</td>
      <td className="px-4 py-2">{field("backorder")}</td>
      <td className="px-4 py-2">
        {canWrite ? (
          <button
            type="button"
            className="btn-ghost text-sm"
            disabled={busy}
            onClick={() =>
              run({ action: "settings", sku: p.sku, locationId: p.locationId, safetyStock: int(s.safety), lowStockThreshold: int(s.alert), backorderLimit: int(s.backorder) }, "Saved.")
            }
          >
            Save
          </button>
        ) : null}
        {status}
      </td>
    </tr>
  );
}

function Count() {
  const { run, busy, status } = useAction();
  const [csv, setCsv] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<Array<{ sku: string; locationId: string; lotNo: string; counted: number; onHand: number | null; delta: number; problem?: string }> | null>(null);
  async function go(apply: boolean) {
    const res = await run({ action: "count", csv, apply, reason: reason || "stock count" }, apply ? "Count applied." : "Preview ready.");
    if (res && Array.isArray(res.lines)) setLines(res.lines as typeof lines);
  }
  return (
    <Panel title="Stock count">
      <p className="text-sm text-ink/70 mb-3">
        Paste a count from the warehouse or a shelf count, one line per lot: <span className="font-mono">sku,location,lot,counted</span>. Preview shows each difference; applying
        records them as count adjustments in the log.
      </p>
      <textarea className="input font-mono text-sm min-h-[120px]" value={csv} onChange={(e) => setCsv(e.target.value)} aria-label="Count lines" />
      <label className="text-xs text-ink/60 block mt-2">
        Reason (e.g. monthly count, warehouse report date)
        <input className="input py-1.5 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      </label>
      <div className="flex gap-2 mt-3">
        <button type="button" className="btn-secondary text-sm" disabled={busy || !csv.trim()} onClick={() => go(false)}>
          Preview
        </button>
        <button type="button" className="btn-primary text-sm" disabled={busy || !lines || lines.some((l) => l.problem) || reason.trim().length < 3} onClick={() => go(true)}>
          Apply differences
        </button>
      </div>
      {status}
      {lines ? (
        <Table head={["SKU", "Location", "Lot", "On record", "Counted", "Difference", ""]}>
          {lines.map((l, i) => (
            <tr key={i} className="border-t border-cloud-300 text-sm">
              <td className="px-4 py-2 font-mono">{l.sku}</td>
              <td className="px-4 py-2">{l.locationId}</td>
              <td className="px-4 py-2 font-mono">{l.lotNo}</td>
              <td className="px-4 py-2">{l.onHand ?? ""}</td>
              <td className="px-4 py-2">{l.counted}</td>
              <td className="px-4 py-2">{l.problem ? "" : l.delta > 0 ? `+${l.delta}` : l.delta}</td>
              <td className="px-4 py-2">{l.problem === "unknown_lot" ? <Pill tone="bad">Lot not on record: receive it first</Pill> : l.problem ? <Pill tone="bad">Not a whole number</Pill> : null}</td>
            </tr>
          ))}
        </Table>
      ) : null}
    </Panel>
  );
}

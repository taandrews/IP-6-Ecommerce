"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Empty, Panel, Pill, Table } from "@/components/admin/ui";
import type { Item, Location, LocationType, Lot, Movement, Position } from "@/lib/inventory/store";
import { normalizeGtin, parseGs1 } from "@/lib/inventory/gs1";
import { formatPhone } from "@/lib/phone";

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
  items: Item[];
  positions: Position[];
  lots: Lot[];
  recent: Record<string, Movement[]>;
  canWrite: boolean;
  canExport: boolean;
}) {
  const locName = useMemo(() => new Map(props.locations.map((l) => [l.locationId, `${l.name} (${l.code})`])), [props.locations]);
  const gtinBySku = useMemo(() => new Map(props.items.map((i) => [i.sku, i.gtin])), [props.items]);
  return (
    <div className="space-y-6">
      <Locations locations={props.locations} canWrite={props.canWrite} />
      {props.canWrite && props.locations.length ? <Actions variants={props.variants} locations={props.locations} lots={props.lots} gtinBySku={gtinBySku} /> : null}
      {props.variants.map((v) => (
        <SkuPanel
          key={v.sku}
          variant={v}
          positions={props.positions.filter((p) => p.sku === v.sku)}
          lots={props.lots.filter((l) => l.sku === v.sku && l.onHand > 0)}
          recent={props.recent[v.sku] ?? []}
          locName={locName}
          gtin={gtinBySku.get(v.sku)}
          canWrite={props.canWrite}
          canExport={props.canExport}
        />
      ))}
      {props.canWrite ? <Count /> : null}
    </div>
  );
}

const TYPES: Record<LocationType, string> = { warehouse: "Own warehouse", "3pl": "Fulfilment partner (3PL)", store: "Shop" };

const EMPTY_LOCATION = { code: "", name: "", type: "warehouse" as LocationType, line1: "", line2: "", city: "", region: "", postalCode: "", country: "US", gln: "", company: "", companyPhone: "", contactName: "", contactRole: "", contactEmail: "", contactPhone: "", accountNumber: "", receivingNotes: "", countries: "US", priority: "10", active: true };

function Locations({ locations, canWrite }: { locations: Location[]; canWrite: boolean }) {
  const { run, busy, status } = useAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_LOCATION);
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function edit(l: Location) {
    setEditing(l.locationId);
    setForm({
      code: l.code,
      name: l.name,
      type: l.type,
      line1: l.address.line1,
      line2: l.address.line2 ?? "",
      city: l.address.city,
      region: l.address.region ?? "",
      postalCode: l.address.postalCode ?? "",
      country: l.address.country,
      gln: l.gln ?? "",
      company: l.operator.company,
      companyPhone: l.operator.phone,
      contactName: l.contact.name,
      contactRole: l.contact.role ?? "",
      contactEmail: l.contact.email,
      contactPhone: l.contact.phone,
      accountNumber: l.accountNumber ?? "",
      receivingNotes: l.receivingNotes ?? "",
      countries: l.countries.join(", "),
      priority: String(l.priority),
      active: l.active,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields = {
      name: form.name,
      type: form.type,
      address: { line1: form.line1, line2: form.line2, city: form.city, region: form.region, postalCode: form.postalCode, country: form.country.trim().toUpperCase() },
      gln: form.gln.replace(/\s/g, ""),
      operator: { company: form.company, phone: form.companyPhone },
      contact: { name: form.contactName, role: form.contactRole, email: form.contactEmail, phone: form.contactPhone },
      accountNumber: form.accountNumber,
      receivingNotes: form.receivingNotes,
      countries: form.countries.split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase()),
      priority: int(form.priority),
      active: form.active,
    };
    const res = editing
      ? await run({ action: "location_update", locationId: editing, ...fields }, "Location saved.")
      : await run({ action: "location", code: form.code, ...fields }, "Location added.");
    if (res) {
      setEditing(null);
      setForm(EMPTY_LOCATION);
    }
  }

  const input = (k: keyof typeof form, label: string, opts: { required?: boolean; disabled?: boolean; hint?: string; className?: string; maxLength?: number; type?: string } = {}) => (
    <label className={`text-xs text-ink/60 ${opts.className ?? ""}`}>
      {label}
      <input
        className="input py-1.5 text-sm"
        type={opts.type ?? "text"}
        value={String(form[k])}
        onChange={(e) => set(k, e.target.value)}
        required={opts.required}
        disabled={opts.disabled}
        maxLength={opts.maxLength}
      />
      {opts.hint ? <span className="block mt-0.5 text-[11px] text-ink/50">{opts.hint}</span> : null}
    </label>
  );

  return (
    <Panel title="Locations">
      {locations.length ? (
        <Table head={["Code", "Location", "Address", "Contact", "Ships to", "Priority", "Status", ""]} minWidth={1100}>
          {locations.map((l) => (
            <tr key={l.locationId} className="border-t border-cloud-300 text-sm">
              <td className="px-4 py-2 font-mono font-semibold">{l.code}</td>
              <td className="px-4 py-2">
                {l.name}
                <span className="block text-xs text-ink/55">
                  {TYPES[l.type]} · {l.operator.company}
                </span>
                <span className="block text-xs text-ink/55">Main: {formatPhone(l.operator.phone)}</span>
                {l.accountNumber ? <span className="block text-xs text-ink/55">Account {l.accountNumber}</span> : null}
                {l.gln ? <span className="block font-mono text-xs text-ink/55">GLN {l.gln}</span> : null}
              </td>
              <td className="px-4 py-2">
                {[l.address.line1, l.address.line2, l.address.city, l.address.region, l.address.postalCode].filter(Boolean).join(", ")} {l.address.country}
                {l.receivingNotes ? <span className="block mt-1 text-xs text-ink/55 whitespace-pre-line">{l.receivingNotes}</span> : null}
              </td>
              <td className="px-4 py-2">
                {l.contact.name}
                {l.contact.role ? <span className="text-ink/55">, {l.contact.role}</span> : null}
                <a className="block text-xs text-navy-800 underline" href={`mailto:${l.contact.email}`}>
                  {l.contact.email}
                </a>
                <a className="block text-xs text-navy-800 underline" href={`tel:${l.contact.phone}`}>
                  {formatPhone(l.contact.phone)}
                </a>
              </td>
              <td className="px-4 py-2">{l.countries.includes("*") ? "Anywhere" : l.countries.join(", ")}</td>
              <td className="px-4 py-2">{l.priority}</td>
              <td className="px-4 py-2">{l.active ? <Pill tone="good">Active</Pill> : <Pill tone="neutral">Off</Pill>}</td>
              <td className="px-4 py-2">
                {canWrite ? (
                  <button type="button" className="btn-ghost text-sm" onClick={() => edit(l)}>
                    Edit
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>No locations yet.</Empty>
      )}
      {canWrite ? (
        <form className="mt-5 grid gap-3 sm:grid-cols-4 items-start" onSubmit={save}>
          <h3 className="sm:col-span-4 text-sm font-semibold text-navy-800">{editing ? `Edit ${form.code}` : "Add a location"}</h3>
          {input("code", "Code", { required: !editing, disabled: !!editing, maxLength: 12, hint: editing ? "Permanent" : "2 to 12 letters or digits, e.g. MD1. Permanent once saved." })}
          {input("name", "Name", { required: true, maxLength: 80 })}
          <label className="text-xs text-ink/60">
            Type
            <select className="input py-1.5 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {(Object.keys(TYPES) as LocationType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPES[t]}
                </option>
              ))}
            </select>
          </label>
          {input("gln", "GS1 GLN (optional)", { maxLength: 13, hint: "13 digits, from GS1 or your 3PL" })}
          {input("line1", "Street address", { required: true, className: "sm:col-span-2", maxLength: 120 })}
          {input("line2", "Address line 2", { className: "sm:col-span-2", maxLength: 120 })}
          {input("city", "City", { required: true, maxLength: 80 })}
          {input("region", "State or region", { maxLength: 80 })}
          {input("postalCode", "Postal code", { maxLength: 20 })}
          {input("country", "Country (2-letter code)", { required: true, maxLength: 2 })}
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Operator</h4>
          {input("company", "Company", { required: true, className: "sm:col-span-2", maxLength: 120, hint: "Who runs the site: your company or the fulfilment partner" })}
          {input("companyPhone", "Main phone", { required: true, type: "tel", maxLength: 40, hint: "Add + and the country code if outside the site's country" })}
          {input("accountNumber", "Our account number with them", { maxLength: 60 })}
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Primary contact</h4>
          {input("contactName", "Name", { required: true, maxLength: 120 })}
          {input("contactRole", "Role", { maxLength: 80 })}
          {input("contactEmail", "Email", { required: true, type: "email", maxLength: 254 })}
          {input("contactPhone", "Direct phone", { required: true, type: "tel", maxLength: 40 })}
          <label className="text-xs text-ink/60 sm:col-span-4">
            Receiving notes (dock hours, appointments)
            <textarea className="input py-1.5 text-sm min-h-[64px]" value={form.receivingNotes} onChange={(e) => set("receivingNotes", e.target.value)} maxLength={1000} />
          </label>
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Shipping</h4>
          {input("countries", "Ships to (country codes, or *)", { required: true, className: "sm:col-span-2" })}
          {input("priority", "Priority (lower ships first)")}
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active
            </label>
          </div>
          <div className="sm:col-span-4 flex items-center gap-3">
            <button className="btn-secondary text-sm" disabled={busy}>
              {editing ? "Save changes" : "Add location"}
            </button>
            {editing ? (
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY_LOCATION);
                }}
              >
                Cancel
              </button>
            ) : null}
            {status}
          </div>
        </form>
      ) : null}
    </Panel>
  );
}

function Actions({ variants, locations, lots, gtinBySku }: { variants: Variant[]; locations: Location[]; lots: Lot[]; gtinBySku: Map<string, string> }) {
  const { run, busy, status } = useAction();
  const [kind, setKind] = useState<"receive" | "adjust" | "transfer">("receive");
  const [f, setF] = useState({ sku: variants[0]?.sku ?? "", locationId: locations[0]?.locationId ?? "", to: locations[1]?.locationId ?? "", lotNo: "", expiresOn: "", qty: "", type: "damage", reason: "" });
  const lotOptions = lots.filter((l) => l.sku === f.sku && l.locationId === f.locationId && l.onHand > 0);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const [scan, setScan] = useState("");
  const [scanNote, setScanNote] = useState<{ ok: boolean; text: string } | null>(null);

  /** Reads a GS1 carton barcode: picks the product by its GTIN and fills the lot and expiry. */
  function readScan(raw: string) {
    setScan(raw);
    if (!raw.trim()) return setScanNote(null);
    const s = parseGs1(raw);
    if (!s?.gtin) return setScanNote({ ok: false, text: "Not a GS1 product barcode. Scan the carton label that shows (01), (10) and (17)." });
    const match = [...gtinBySku].find(([, g]) => g === s.gtin)?.[0];
    if (!match) return setScanNote({ ok: false, text: `GTIN ${s.gtin} isn't set on any product. Set it under the product below, then scan again.` });
    setF((x) => ({ ...x, sku: match, lotNo: s.lot ?? x.lotNo, expiresOn: s.expiresOn ?? x.expiresOn }));
    const missing = [s.lot ? null : "lot", s.expiresOn ? null : "expiry date"].filter(Boolean);
    setScanNote({ ok: true, text: `${variants.find((v) => v.sku === match)?.label ?? match}${missing.length ? `. Not on the barcode, enter by hand: ${missing.join(" and ")}.` : "."}` });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = int(f.qty);
    if (kind === "receive")
      run({ action: "receive", sku: f.sku, locationId: f.locationId, lotNo: f.lotNo.trim(), expiresOn: f.expiresOn, qty: n, reason: f.reason || undefined, scan: scan.trim() || undefined }, "Stock received.").then((r) => {
        if (r) {
          setScan("");
          setScanNote(null);
        }
      });
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
        {kind === "receive" ? (
          <label className="text-xs text-ink/60 sm:col-span-3">
            Scan the carton barcode (GS1-128 or DataMatrix), or fill in the fields by hand
            <input
              className="input py-1.5 text-sm font-mono"
              value={scan}
              onChange={(e) => readScan(e.target.value)}
              onKeyDown={(e) => {
                // Scanners end with Enter; don't submit the form on the scan itself.
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="(01)…(10)…(17)…"
              autoComplete="off"
            />
            {scanNote ? <span className={`block mt-1 text-sm ${scanNote.ok ? "text-emerald-700" : "text-danger"}`}>{scanNote.text}</span> : null}
          </label>
        ) : null}
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
                {l.code} · {l.name}
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
                  {l.code} · {l.name}
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

function SkuPanel(props: { variant: Variant; positions: Position[]; lots: Lot[]; recent: Movement[]; locName: Map<string, string>; gtin?: string; canWrite: boolean; canExport: boolean }) {
  const { variant, positions, lots, recent, locName } = props;
  const tracked = positions.length > 0;
  return (
    <section id={variant.sku} className="rounded-lg border border-cloud-300 bg-surface">
      <div className="border-b border-cloud-300 px-5 py-3 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h2 className="font-semibold text-navy-800">{variant.label}</h2>
          <p className="font-mono text-xs text-ink/55">{variant.sku}</p>
          <Gtin sku={variant.sku} gtin={props.gtin} canWrite={props.canWrite} />
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
  const [lines, setLines] = useState<Array<{ sku: string; code: string; lotNo: string; counted: number; onHand: number | null; delta: number; problem?: string }> | null>(null);
  async function go(apply: boolean) {
    const res = await run({ action: "count", csv, apply, reason: reason || "stock count" }, apply ? "Count applied." : "Preview ready.");
    if (res && Array.isArray(res.lines)) setLines(res.lines as typeof lines);
  }
  return (
    <Panel title="Stock count">
      <p className="text-sm text-ink/70 mb-3">
        Paste a count from the warehouse or a shelf count, one line per lot: <span className="font-mono">sku,location code,lot,counted</span>. Preview shows each difference; applying
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
              <td className="px-4 py-2 font-mono">{l.code}</td>
              <td className="px-4 py-2 font-mono">{l.lotNo}</td>
              <td className="px-4 py-2">{l.onHand ?? ""}</td>
              <td className="px-4 py-2">{l.counted}</td>
              <td className="px-4 py-2">{l.problem ? "" : l.delta > 0 ? `+${l.delta}` : l.delta}</td>
              <td className="px-4 py-2">{l.problem === "unknown_lot" ? (
                  <Pill tone="bad">Lot not on record: receive it first</Pill>
                ) : l.problem === "unknown_location" ? (
                  <Pill tone="bad">No location has this code</Pill>
                ) : l.problem ? (
                  <Pill tone="bad">Not a whole number</Pill>
                ) : null}</td>
            </tr>
          ))}
        </Table>
      ) : null}
    </Panel>
  );
}

function Gtin({ sku, gtin, canWrite }: { sku: string; gtin?: string; canWrite: boolean }) {
  const { run, busy, status } = useAction();
  const [value, setValue] = useState(gtin ?? "");
  const valid = !value.trim() || normalizeGtin(value) !== null;
  if (!canWrite)
    return (
      <p className="text-xs text-ink/60 mt-1">
        GTIN: <span className="font-mono">{gtin ?? "not set"}</span>
      </p>
    );
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <label className="text-xs text-ink/60 flex items-center gap-2">
        GTIN (barcode number, e.g. the UPC)
        <input className="input py-1 text-sm font-mono w-44" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!valid} maxLength={14} />
      </label>
      <button
        type="button"
        className="btn-ghost text-sm"
        disabled={busy || !valid || (value.trim() || null) === (gtin ?? null)}
        onClick={() => run({ action: "item", sku, gtin: value.trim() }, "GTIN saved.")}
      >
        Save
      </button>
      {valid ? null : <span className="text-sm text-danger">Check digit or length is wrong.</span>}
      {status}
    </div>
  );
}

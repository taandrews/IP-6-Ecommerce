"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminError, adminRequest, fieldName } from "@/components/admin/client";
import { Empty, Panel, Pill, Table } from "@/components/admin/ui";
import type { Item, Location, LocationType, Lot, Movement, Position } from "@/lib/inventory/store";
import { gtinProblem, isGln, parseGs1 } from "@/lib/inventory/gs1";
import { formatPhone, toE164 } from "@/lib/phone";

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
  /** Request fields the API said failed, e.g. "contact.email". */
  const [failed, setFailed] = useState<string[]>([]);
  async function run(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    setFailed([]);
    try {
      const res = await adminRequest<Record<string, unknown>>("/api/admin/inventory", "POST", body);
      setMsg({ ok: true, text: ok });
      router.refresh();
      return res;
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
      setFailed(err instanceof AdminError ? err.fields : []);
      return null;
    } finally {
      setBusy(false);
    }
  }
  const status = msg ? <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-danger"}`}>{msg.text}</p> : null;
  return { run, busy, status, failed, setMsg };
}

/** Marks a field the form requires; the legend at the top of each form explains it. */
function Req() {
  return (
    <span className="text-danger" aria-hidden="true">
      {" "}*
    </span>
  );
}

function RequiredLegend() {
  return (
    <p className="text-xs text-ink/60">
      Fields marked <span className="text-danger">*</span> are required.
    </p>
  );
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

type LocationForm = typeof EMPTY_LOCATION;
type LocationKey = keyof LocationForm;

/** Request field paths (from the API) to the form field that holds them. */
const LOCATION_FIELD: Record<string, LocationKey> = {
  code: "code",
  name: "name",
  type: "type",
  "address.line1": "line1",
  "address.line2": "line2",
  "address.city": "city",
  "address.region": "region",
  "address.postalCode": "postalCode",
  "address.country": "country",
  gln: "gln",
  "operator.company": "company",
  "operator.phone": "companyPhone",
  "contact.name": "contactName",
  "contact.role": "contactRole",
  "contact.email": "contactEmail",
  "contact.phone": "contactPhone",
  accountNumber: "accountNumber",
  receivingNotes: "receivingNotes",
  countries: "countries",
  priority: "priority",
};

const LOCATION_LABEL: Partial<Record<LocationKey, string>> = {
  code: "Code",
  name: "Name",
  line1: "Street address",
  city: "City",
  country: "Country",
  gln: "GS1 GLN",
  company: "Company",
  companyPhone: "Main phone",
  contactName: "Contact name",
  contactEmail: "Contact email",
  contactPhone: "Direct phone",
  countries: "Ships to",
  priority: "Priority",
};

const countryList = (s: string) => s.split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase());

/** The same rules the API applies, checked before sending so every problem shows at once, next to its field. */
function checkLocation(f: LocationForm, creating: boolean): Partial<Record<LocationKey, string>> {
  const e: Partial<Record<LocationKey, string>> = {};
  const country = f.country.trim().toUpperCase();
  const min = (k: LocationKey, n: number) => {
    const v = String(f[k]).trim();
    if (!v) e[k] = "Required.";
    else if (v.length < n) e[k] = `At least ${n} characters.`;
  };
  if (creating) {
    const code = f.code.trim().toUpperCase();
    if (!code) e.code = "Required.";
    else if (!/^[A-Z0-9][A-Z0-9-]{1,11}$/.test(code)) e.code = "2 to 12 letters, digits or hyphens, starting with a letter or digit. No spaces.";
  }
  min("name", 2);
  min("line1", 2);
  min("city", 1);
  if (!country) e.country = "Required.";
  else if (!/^[A-Z]{2}$/.test(country)) e.country = "Use the 2-letter code, e.g. US.";
  const gln = f.gln.replace(/\s/g, "");
  if (gln && !isGln(gln)) e.gln = "A GLN is 13 digits and its last digit must match the others. Leave it blank if you don't have one.";
  min("company", 2);
  min("contactName", 2);
  const email = f.contactEmail.trim();
  if (!email) e.contactEmail = "Required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.contactEmail = "Enter a full email address, e.g. name@company.com.";
  for (const k of ["companyPhone", "contactPhone"] as const) {
    const v = f[k].trim();
    if (!v) e[k] = "Required.";
    else if (!toE164(v, /^[A-Z]{2}$/.test(country) ? country : undefined)) e[k] = `Not a valid number${country ? ` in ${country}` : ""}. For another country, start with + and its code.`;
  }
  const codes = countryList(f.countries);
  if (!codes.length) e.countries = "Required. Use 2-letter codes like US, or * for anywhere.";
  else if (codes.some((c) => !/^(\*|[A-Z]{2})$/.test(c))) e.countries = `Use 2-letter codes like US, separated by commas, or * for anywhere. Not valid: ${codes.filter((c) => !/^(\*|[A-Z]{2})$/.test(c)).join(", ")}.`;
  const p = int(f.priority);
  if (!f.priority.trim()) e.priority = "Required. Use 10 if you have one location.";
  else if (!Number.isInteger(p) || p < 0 || p > 1000) e.priority = "A whole number from 0 to 1000.";
  return e;
}

function Locations({ locations, canWrite }: { locations: Location[]; canWrite: boolean }) {
  const { run, busy, status, failed, setMsg } = useAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_LOCATION);
  const [errors, setErrors] = useState<Partial<Record<LocationKey, string>>>({});
  const set = (k: LocationKey, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  // Fields the server refused that the form's own checks didn't catch.
  const serverErrors = useMemo(() => {
    const out: Partial<Record<LocationKey, string>> = {};
    for (const path of failed) {
      const key = LOCATION_FIELD[path.replace(/\.\d+(?=\.|$)/g, "")];
      if (key) out[key] = `The server refused this ${fieldName(path)}. Check it and try again.`;
    }
    return out;
  }, [failed]);
  const shown = { ...serverErrors, ...errors };

  function reset() {
    setEditing(null);
    setForm(EMPTY_LOCATION);
    setErrors({});
  }

  function edit(l: Location) {
    setErrors({});
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

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const problems = checkLocation(form, !editing);
    setErrors(problems);
    // Listed and focused in the order the fields appear on screen.
    const keys = (Object.keys(EMPTY_LOCATION) as LocationKey[]).filter((k) => problems[k]);
    if (keys.length) {
      const names = keys.map((k) => LOCATION_LABEL[k] ?? k);
      setMsg({ ok: false, text: `Not saved. Fix ${keys.length === 1 ? "this field" : `these ${keys.length} fields`}: ${names.join(", ")}.` });
      formEl.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      return;
    }
    const fields = {
      name: form.name,
      type: form.type,
      address: { line1: form.line1, line2: form.line2, city: form.city, region: form.region, postalCode: form.postalCode, country: form.country.trim().toUpperCase() },
      gln: form.gln.replace(/\s/g, ""),
      operator: { company: form.company, phone: form.companyPhone },
      contact: { name: form.contactName, role: form.contactRole, email: form.contactEmail, phone: form.contactPhone },
      accountNumber: form.accountNumber,
      receivingNotes: form.receivingNotes,
      countries: countryList(form.countries),
      priority: int(form.priority),
      active: form.active,
    };
    const res = editing
      ? await run({ action: "location_update", locationId: editing, ...fields }, "Location saved.")
      : await run({ action: "location", code: form.code, ...fields }, "Location saved.");
    if (res) reset();
  }

  const input = (k: LocationKey, label: string, opts: { required?: boolean; disabled?: boolean; hint?: string; className?: string; maxLength?: number; type?: string; inputMode?: "numeric" | "email" | "tel" } = {}) => {
    const err = shown[k];
    const hintId = `loc-${k}-hint`;
    const errId = `loc-${k}-error`;
    return (
      <label className={`text-xs text-ink/60 ${opts.className ?? ""}`}>
        {label}
        {opts.required ? <Req /> : null}
        <input
          name={k}
          className={`input py-1.5 text-sm ${err ? "border-danger focus:border-danger" : ""}`}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          value={String(form[k])}
          onChange={(e) => set(k, e.target.value)}
          aria-required={opts.required || undefined}
          aria-invalid={err ? true : undefined}
          aria-describedby={[err ? errId : "", opts.hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
          disabled={opts.disabled}
          maxLength={opts.maxLength}
        />
        {err ? (
          <span id={errId} className="block mt-0.5 text-[11px] text-danger">
            {err}
          </span>
        ) : null}
        {opts.hint ? (
          <span id={hintId} className="block mt-0.5 text-[11px] text-ink/50">
            {opts.hint}
          </span>
        ) : null}
      </label>
    );
  };

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
        <form className="mt-5 grid gap-3 sm:grid-cols-4 items-start" onSubmit={save} noValidate>
          <div className="sm:col-span-4">
            <h3 className="text-sm font-semibold text-navy-800">{editing ? `Edit location ${form.code}` : "New location"}</h3>
            <RequiredLegend />
          </div>
          {input("code", "Code", { required: !editing, disabled: !!editing, maxLength: 12, hint: editing ? "Permanent" : "2 to 12 letters, digits or hyphens, e.g. MD1. Permanent once saved." })}
          {input("name", "Name", { required: true, maxLength: 80, hint: "At least 2 characters, e.g. Baltimore fulfilment centre" })}
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
          {input("gln", "GS1 GLN", { maxLength: 13, inputMode: "numeric", hint: "Optional. 13 digits, from GS1 or your 3PL" })}
          {input("line1", "Street address", { required: true, className: "sm:col-span-2", maxLength: 120, hint: "Number and street, e.g. 100 Industrial Way" })}
          {input("line2", "Address line 2", { className: "sm:col-span-2", maxLength: 120, hint: "Optional. Unit, suite or dock, e.g. Dock 4" })}
          {input("city", "City", { required: true, maxLength: 80, hint: "e.g. Baltimore" })}
          {input("region", "State or region", { maxLength: 80, hint: "Optional. Code or full name, e.g. MD or Maryland" })}
          {input("postalCode", "Postal code", { maxLength: 20, hint: "Optional. e.g. 21230 or 21230-1234" })}
          {input("country", "Country", { required: true, maxLength: 2, hint: "2-letter code, e.g. US" })}
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Operator</h4>
          {input("company", "Company", { required: true, className: "sm:col-span-2", maxLength: 120, hint: "Who runs the site: your company or the fulfilment partner, e.g. Acme Fulfilment LLC" })}
          {input("companyPhone", "Main phone", { required: true, type: "tel", maxLength: 40, hint: "Any format, e.g. (410) 555-0123. For another country, start with + and its code, e.g. +44 20 7946 0958" })}
          {input("accountNumber", "Our account number with them", { maxLength: 60, hint: "Optional. As they write it, e.g. IP6-0042" })}
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Primary contact</h4>
          {input("contactName", "Name", { required: true, maxLength: 120, hint: "First and last name, e.g. Jo Smith" })}
          {input("contactRole", "Role", { maxLength: 80, hint: "Optional. e.g. Account manager" })}
          {input("contactEmail", "Email", { required: true, type: "email", inputMode: "email", maxLength: 254, hint: "e.g. jo@acmefulfilment.com" })}
          {input("contactPhone", "Direct phone", { required: true, type: "tel", maxLength: 40, hint: "Any format, e.g. 410-555-0124. Start with + for another country" })}
          <label className="text-xs text-ink/60 sm:col-span-4">
            Receiving notes
            <textarea className="input py-1.5 text-sm min-h-[64px]" value={form.receivingNotes} onChange={(e) => set("receivingNotes", e.target.value)} maxLength={1000} aria-describedby="loc-notes-hint" />
            <span id="loc-notes-hint" className="block mt-0.5 text-[11px] text-ink/50">
              Optional, up to 1000 characters. e.g. Dock open Mon to Fri 8am to 3pm; book deliveries 48 hours ahead.
            </span>
          </label>
          <h4 className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide text-ink/60 pt-2">Shipping</h4>
          {input("countries", "Ships to", { required: true, className: "sm:col-span-2", hint: "2-letter country codes separated by commas, e.g. US, CA. Or * for anywhere." })}
          {input("priority", "Priority", { required: true, inputMode: "numeric", maxLength: 4, hint: "0 to 1000. Lower ships first." })}
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active
            </label>
          </div>
          <div className="sm:col-span-4 flex items-center gap-3">
            <button className="btn-secondary text-sm" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Save location"}
            </button>
            {editing ? (
              <button type="button" className="btn-ghost text-sm" onClick={reset}>
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

type MoveKey = "sku" | "locationId" | "to" | "lotNo" | "expiresOn" | "qty" | "type" | "reason";

/** API field paths for stock movements to the form field that holds them. */
const MOVE_FIELD: Record<string, MoveKey> = { sku: "sku", locationId: "locationId", from: "locationId", to: "to", lotNo: "lotNo", expiresOn: "expiresOn", qty: "qty", delta: "qty", type: "type", reason: "reason" };
const MOVE_LABEL: Record<MoveKey, string> = { sku: "Product", locationId: "Location", to: "To", lotNo: "Lot number", expiresOn: "Expiry date", qty: "Units", type: "Type", reason: "Reason" };

function Actions({ variants, locations, lots, gtinBySku }: { variants: Variant[]; locations: Location[]; lots: Lot[]; gtinBySku: Map<string, string> }) {
  const { run, busy, status, failed, setMsg } = useAction();
  const [errors, setErrors] = useState<Partial<Record<MoveKey, string>>>({});
  const [kind, setKind] = useState<"receive" | "adjust" | "transfer">("receive");
  const [f, setF] = useState({ sku: variants[0]?.sku ?? "", locationId: locations[0]?.locationId ?? "", to: locations[1]?.locationId ?? "", lotNo: "", expiresOn: "", qty: "", type: "damage", reason: "" });
  const lotOptions = lots.filter((l) => l.sku === f.sku && l.locationId === f.locationId && l.onHand > 0);
  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };
  const serverErrors: Partial<Record<MoveKey, string>> = {};
  for (const path of failed) {
    const key = MOVE_FIELD[path];
    if (key) serverErrors[key] = `The server refused this ${fieldName(path)}. Check it and try again.`;
  }
  const shown = { ...serverErrors, ...errors };
  /** Error text under a field, linked to it for screen readers. */
  const err = (k: MoveKey) =>
    shown[k] ? (
      <span id={`mv-${k}-error`} className="block mt-0.5 text-[11px] text-danger">
        {shown[k]}
      </span>
    ) : null;
  const a11y = (k: MoveKey, hint?: boolean) => ({
    name: k,
    "aria-invalid": shown[k] ? true : undefined,
    "aria-describedby": [shown[k] ? `mv-${k}-error` : "", hint ? `mv-${k}-hint` : ""].filter(Boolean).join(" ") || undefined,
    className: `input py-1.5 text-sm ${shown[k] ? "border-danger focus:border-danger" : ""}`,
  });
  const hint = (k: MoveKey, text: string) => (
    <span id={`mv-${k}-hint`} className="block mt-0.5 text-[11px] text-ink/50">
      {text}
    </span>
  );
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

  /** The API's rules, checked first so every problem shows at once. */
  function check(): Partial<Record<MoveKey, string>> {
    const e: Partial<Record<MoveKey, string>> = {};
    const n = int(f.qty);
    const lot = f.lotNo.trim();
    if (kind === "receive") {
      if (!lot) e.lotNo = "Required. Copy it from the carton label.";
      else if (lot.length > 20 || !/^[A-Za-z0-9._/-]+$/.test(lot)) e.lotNo = "Up to 20 letters, digits, dots, hyphens or slashes. No spaces.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.expiresOn)) e.expiresOn = "Required. Pick the date printed on the carton.";
    } else if (!lot) e.lotNo = lotOptions.length ? "Required. Choose a lot." : "This product has no stock at this location.";
    if (!f.qty.trim()) e.qty = "Required.";
    else if (kind === "adjust" ? !Number.isInteger(n) || n === 0 || Math.abs(n) > 1_000_000 : !Number.isInteger(n) || n < 1 || n > 1_000_000)
      e.qty = kind === "adjust" ? "A whole number, not 0. Use a minus sign to remove units, e.g. -3." : "A whole number from 1 to 1,000,000.";
    if (kind === "adjust" && f.reason.trim().length < 3) e.reason = "Required. At least 3 characters, e.g. Carton crushed in transit.";
    if (kind === "transfer" && f.to === f.locationId) e.to = "Choose a different location from the one you're moving stock out of.";
    return e;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const problems = check();
    setErrors(problems);
    const keys = Object.keys(problems) as MoveKey[];
    if (keys.length) {
      setMsg({ ok: false, text: `Not saved. Fix ${keys.length === 1 ? "this field" : `these ${keys.length} fields`}: ${keys.map((k) => MOVE_LABEL[k]).join(", ")}.` });
      formEl.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      return;
    }
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
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3 items-start" noValidate>
        <div className="sm:col-span-3">
          <RequiredLegend />
        </div>
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
          <Req />
          <select {...a11y("sku")} value={f.sku} onChange={(e) => set("sku", e.target.value)}>
            {variants.map((v) => (
              <option key={v.sku} value={v.sku}>
                {v.label} ({v.sku})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink/60">
          {kind === "transfer" ? "From" : "Location"}
          <Req />
          <select {...a11y("locationId")} value={f.locationId} onChange={(e) => set("locationId", e.target.value)}>
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
            <Req />
            <select {...a11y("to")} value={f.to} onChange={(e) => set("to", e.target.value)}>
              {locations.map((l) => (
                <option key={l.locationId} value={l.locationId}>
                  {l.code} · {l.name}
                </option>
              ))}
            </select>
            {err("to")}
          </label>
        ) : null}
        {kind === "receive" ? (
          <>
            <label className="text-xs text-ink/60">
              Lot number
              <Req />
              <input {...a11y("lotNo", true)} value={f.lotNo} onChange={(e) => set("lotNo", e.target.value)} maxLength={20} autoComplete="off" />
              {err("lotNo")}
              {hint("lotNo", "As printed on the carton, e.g. L24-0915. Letters, digits, . - / only.")}
            </label>
            <label className="text-xs text-ink/60">
              Expiry date
              <Req />
              <input type="date" {...a11y("expiresOn", true)} value={f.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} />
              {err("expiresOn")}
              {hint("expiresOn", "From the carton. If it shows only a month, use the last day of that month.")}
            </label>
          </>
        ) : (
          <label className="text-xs text-ink/60">
            Lot
            <Req />
            <select {...a11y("lotNo")} value={f.lotNo} onChange={(e) => set("lotNo", e.target.value)}>
              <option value="">Choose a lot</option>
              {lotOptions.map((l) => (
                <option key={l.lotNo} value={l.lotNo}>
                  {l.lotNo} · {l.onHand} on hand · expires {l.expiresOn}
                </option>
              ))}
            </select>
            {err("lotNo")}
          </label>
        )}
        {kind === "adjust" ? (
          <label className="text-xs text-ink/60">
            Type
            <Req />
            <select {...a11y("type")} value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="damage">Damaged</option>
              <option value="expired">Expired (write off)</option>
              <option value="correction">Correction</option>
            </select>
          </label>
        ) : null}
        <label className="text-xs text-ink/60">
          {kind === "adjust" ? "Change in units" : "Units"}
          <Req />
          <input {...a11y("qty", true)} inputMode={kind === "adjust" ? "text" : "numeric"} value={f.qty} onChange={(e) => set("qty", e.target.value)} />
          {err("qty")}
          {hint("qty", kind === "adjust" ? "Whole number. Minus removes units, e.g. -3; plus adds, e.g. 2." : "Whole units (bottles or tubs), e.g. 240.")}
        </label>
        <label className="text-xs text-ink/60 sm:col-span-2">
          {kind === "adjust" ? "Reason" : "Reason or reference"}
          {kind === "adjust" ? <Req /> : null}
          <input {...a11y("reason", true)} value={f.reason} onChange={(e) => set("reason", e.target.value)} maxLength={300} />
          {err("reason")}
          {hint("reason", kind === "adjust" ? "What happened, e.g. Carton crushed in transit." : "Optional, up to 300 characters, e.g. PO 1042 or the shipment tracking number.")}
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary text-sm" disabled={busy}>
            {busy ? "Saving…" : kind === "receive" ? "Save receipt" : kind === "adjust" ? "Save adjustment" : "Save transfer"}
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
          <div>
            <Table head={["Location", "On hand", "Held at checkout", "Available", "Safety stock", "Alert at", "Backorder limit", ""]} minWidth={900}>
              {positions.map((p) => (
                <PositionRow key={p.locationId} p={p} name={locName.get(p.locationId) ?? p.locationId} canWrite={props.canWrite} />
              ))}
            </Table>
            {props.canWrite ? (
              <p className="mt-2 text-[11px] text-ink/50">
                Safety stock, Alert at and Backorder limit are whole numbers, 0 or more. Safety stock is held back from sale; Alert at emails orders@ when available stock falls to it; Backorder limit is how many can
                sell beyond zero.
              </p>
            ) : null}
          </div>
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
  const { run, busy, status, setMsg } = useAction();
  const [s, setS] = useState({ safety: String(p.safetyStock), alert: String(p.lowStockThreshold), backorder: String(p.backorderLimit) });
  const LABEL = { safety: "Safety stock", alert: "Alert at", backorder: "Backorder limit" } as const;
  const bad = (k: keyof typeof s) => {
    const n = int(s[k]);
    return !Number.isInteger(n) || n < 0 || n > 1_000_000;
  };
  const low = p.lowStockThreshold > 0 && p.available <= p.lowStockThreshold;
  const field = (k: keyof typeof s) =>
    canWrite ? (
      <input
        className={`input py-1 text-sm w-20 ${bad(k) ? "border-danger focus:border-danger" : ""}`}
        inputMode="numeric"
        value={s[k]}
        onChange={(e) => setS({ ...s, [k]: e.target.value })}
        aria-label={`${LABEL[k]} for ${name} (whole number, 0 or more)`}
        aria-invalid={bad(k) || undefined}
      />
    ) : (
      s[k]
    );
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
            onClick={() => {
              const wrong = (Object.keys(LABEL) as Array<keyof typeof s>).filter(bad);
              if (wrong.length) return setMsg({ ok: false, text: `Not saved. ${wrong.map((k) => LABEL[k]).join(", ")}: use a whole number, 0 or more.` });
              run({ action: "settings", sku: p.sku, locationId: p.locationId, safetyStock: int(s.safety), lowStockThreshold: int(s.alert), backorderLimit: int(s.backorder) }, "Saved.");
            }}
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
      <label htmlFor="count-lines" className="text-xs text-ink/60">
        Count lines
        <Req />
      </label>
      <textarea
        id="count-lines"
        className="input font-mono text-sm min-h-[120px]"
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={"SUP-IP6-CAP240,MD1,L24-0915,118\nPET-IP6-PWD120,MD1,L24-0801,42"}
        aria-describedby="count-lines-hint"
      />
      <span id="count-lines-hint" className="block mt-0.5 text-[11px] text-ink/50">
        One lot per line, commas between: product SKU, location code, lot number, units counted (a whole number). Up to 2,000 lines. A header row that starts with sku is skipped.
      </span>
      <label className="text-xs text-ink/60 block mt-2">
        Reason
        <Req />
        <input className="input py-1.5 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} aria-describedby="count-reason-hint" />
        <span id="count-reason-hint" className="block mt-0.5 text-[11px] text-ink/50">
          At least 3 characters, needed to apply, e.g. Monthly count, 30 Nov 2026.
        </span>
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
  const [tried, setTried] = useState(false);
  const problem = value.trim() ? gtinProblem(value) : null;
  const id = `gtin-${sku}`;
  if (!canWrite)
    return (
      <p className="text-xs text-ink/60 mt-1">
        GTIN: <span className="font-mono">{gtin ?? "not set"}</span>
      </p>
    );
  const unchanged = (value.trim() || null) === (gtin ?? null);
  return (
    <div className="mt-1 max-w-xl">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-xs text-ink/60">
          GTIN (barcode number)
        </label>
        <input
          id={id}
          className={`input py-1 text-sm font-mono w-48 ${problem ? "border-danger focus:border-danger" : ""}`}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTried(false);
          }}
          aria-invalid={problem ? true : undefined}
          aria-describedby={`${id}-hint${problem ? ` ${id}-error` : ""}`}
          maxLength={20}
        />
        <button
          type="button"
          className="btn-ghost text-sm"
          disabled={busy || unchanged}
          onClick={() => {
            setTried(true);
            if (problem) return;
            run({ action: "item", sku, gtin: value.trim() }, value.trim() ? "GTIN saved." : "GTIN removed.");
          }}
        >
          {busy ? "Saving…" : !value.trim() && gtin ? "Remove GTIN" : "Save GTIN"}
        </button>
        {status}
      </div>
      {problem ? (
        <p id={`${id}-error`} className={`mt-0.5 text-[11px] text-danger ${tried ? "font-semibold" : ""}`} role={tried ? "alert" : undefined}>
          {tried ? "Not saved. " : ""}
          {problem}
        </p>
      ) : null}
      <p id={`${id}-hint`} className="mt-0.5 text-[11px] text-ink/50">
        Optional. The digits under the product barcode: 12 for a UPC (e.g. 036000291452), 13 for an EAN, or 8 or 14. Spaces and dashes are fine. Leave blank and save to remove.
      </p>
    </div>
  );
}

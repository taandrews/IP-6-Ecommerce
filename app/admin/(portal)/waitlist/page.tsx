import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { sealEmail } from "@/lib/admin/seal";
import { maskEmail, maskName } from "@/lib/admin/pii";
import { listWaitlist, type WaitlistRecord } from "@/lib/data/waitlist";
import { countryName, SELLABLE_COUNTRIES } from "@/lib/countries";
import { products } from "@/content/products";
import { Empty, Notice, PageHeader, Panel, Stat, Table } from "@/components/admin/ui";

export const metadata = { title: "Launch waitlist" };
export const dynamic = "force-dynamic";

const PRODUCT_NAMES = new Map(products.flatMap((p) => [[p.sku, p.name] as const, ...p.variants.map((v) => [v.sku, p.name] as const)]));

const FORM_NAMES: Record<WaitlistRecord["source"], string> = {
  product: "Product page",
  checkout: "Checkout",
  arrival: "Welcome notice",
};

/** The first sign-up's form and page; older rows only stored the latest. */
const signupForm = (r: WaitlistRecord) => FORM_NAMES[r.signupSource ?? r.source];
const signupPage = (r: WaitlistRecord) => r.signupPage ?? r.page;
const productInterest = (r: WaitlistRecord) => [...new Set((r.products ?? []).map((s) => PRODUCT_NAMES.get(s) ?? s))].join(", ");
const campaignLabel = (r: WaitlistRecord) => [r.campaign?.source, r.campaign?.medium, r.campaign?.campaign].filter(Boolean).join(" / ");

function tally(rows: WaitlistRecord[], keys: (r: WaitlistRecord) => string[]) {
  const m = new Map<string, number>();
  for (const r of rows) for (const k of new Set(keys(r))) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}

export default async function WaitlistPage() {
  const staff = await requireStaffPage("customers:read");
  const pii = can(staff.role, "customers:pii");
  let rows: WaitlistRecord[] = [];
  let error = false;
  try {
    rows = await listWaitlist();
  } catch (err) {
    console.error("[admin] waitlist failed", (err as Error).name);
    error = true;
  }
  const byCountry = tally(rows, (r) => [r.country]);
  const byProduct = tally(rows, (r) => (r.products?.length ? r.products.map((s) => PRODUCT_NAMES.get(s) ?? s) : ["No product viewed"]));
  const byForm = tally(rows, (r) => [signupForm(r)]);
  const byCampaign = tally(rows, (r) => [r.campaign?.source ?? "No campaign link"]);
  const fromCheckout = rows.filter((r) => (r.signupSource ?? r.source) === "checkout").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Launch waitlist"
        intro={`People outside the countries we sell to (now: ${SELLABLE_COUNTRIES.map(countryName).join(", ")}) who asked to hear when we launch there. Kept apart from customers and the US newsletter. Use the counts to choose the next market.`}
      />
      {error ? <Notice tone="bad">The waitlist couldn&apos;t be loaded.</Notice> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Signups" value={rows.length} />
        <Stat label="Countries" value={byCountry.length} />
        <Stat label="Signed up at checkout" value={fromCheckout} hint="Entered a non-US address" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="By country">
          {byCountry.length ? (
            <Table head={["Country", "Signups"]} minWidth={320}>
              {byCountry.map(([c, n]) => (
                <tr key={c}>
                  <td className="px-4 py-2">{countryName(c)} <span className="text-ink/50 font-mono text-xs">{c}</span></td>
                  <td className="px-4 py-2 tabular-nums">{n}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No signups yet.</Empty>
          )}
        </Panel>
        <Panel title="By product">
          {byProduct.length ? (
            <Table head={["Product", "Signups"]} minWidth={320}>
              {byProduct.map(([p, n]) => (
                <tr key={p}>
                  <td className="px-4 py-2">{p}</td>
                  <td className="px-4 py-2 tabular-nums">{n}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No signups yet.</Empty>
          )}
        </Panel>
        <Panel title="By signup form">
          {byForm.length ? (
            <Table head={["Signup form", "Signups"]} minWidth={320}>
              {byForm.map(([f, n]) => (
                <tr key={f}>
                  <td className="px-4 py-2">{f}</td>
                  <td className="px-4 py-2 tabular-nums">{n}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No signups yet.</Empty>
          )}
        </Panel>
        <Panel title="By campaign source">
          {byCampaign.length ? (
            <Table head={["Campaign source", "Signups"]} minWidth={320}>
              {byCampaign.map(([c, n]) => (
                <tr key={c}>
                  <td className="px-4 py-2">{c}</td>
                  <td className="px-4 py-2 tabular-nums">{n}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No signups yet.</Empty>
          )}
        </Panel>
      </div>
      <Panel title="Signups">
        {rows.length ? (
          <Table head={["Email", "Name", "Country", "IP country", "Signup form", "Signup page", "Product interest", "Campaign", "Consent", "Updated"]} minWidth={1280}>
            {rows.slice(0, 500).map((r) => (
              <tr key={r.userId}>
                <td className="px-4 py-2">
                  <Link className="underline" href={`/admin/customers/view?k=${sealEmail(r.email)}`}>{pii ? r.email : maskEmail(r.email)}</Link>
                </td>
                <td className="px-4 py-2">{r.firstName ? (pii ? r.firstName : maskName(r.firstName)) : ""}</td>
                <td className="px-4 py-2">{countryName(r.country)}</td>
                <td className="px-4 py-2">{r.ipCountry ?? ""}</td>
                <td className="px-4 py-2 text-xs">{signupForm(r)}</td>
                <td className="px-4 py-2 text-xs font-mono">{signupPage(r)}</td>
                <td className="px-4 py-2 text-xs">{productInterest(r)}</td>
                <td className="px-4 py-2 text-xs">{campaignLabel(r)}</td>
                <td className="px-4 py-2 text-xs">{r.consentedAt.slice(0, 10)} · v{r.consentVersion}{r.confirmedAt ? " · confirmed" : ""}</td>
                <td className="px-4 py-2 text-xs tabular-nums">{r.updatedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No signups yet.</Empty>
        )}
      </Panel>
    </div>
  );
}

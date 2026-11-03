import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { unsealEmail } from "@/lib/admin/seal";
import { getCustomerProfile } from "@/lib/data/customers";
import { audit } from "@/lib/data/audit";
import { maskEmail, maskName } from "@/lib/admin/pii";
import { Notice, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { CustomerPrivacyActions } from "./CustomerPrivacyActions";
import { QUIZ_LABELS, quizAnswerLabel } from "@/lib/quiz";

export const metadata = { title: "Customer" };

export default async function CustomerViewPage(props: { searchParams: Promise<{ k?: string; request?: string }> }) {
  const searchParams = await props.searchParams;
  const staff = await requireStaffPage("customers:read");
  const email = unsealEmail(searchParams.k);
  if (!email) {
    return (
      <div className="space-y-4">
        <PageHeader title="Customer" />
        <Notice tone="warn">This link has expired. Open the customer again from the Customers page.</Notice>
        <Link href="/admin/customers" className="underline">Customers</Link>
      </div>
    );
  }
  const pii = can(staff.role, "customers:pii");
  const p = await getCustomerProfile(email);
  await audit(staff.actor, "customer.view", p.shopify[0]?.id ?? "site-only", { masked: !pii }, staff.ip);
  const name = p.shopify[0]?.name ?? "";
  const shownName = pii ? name : maskName(name);
  const shownEmail = pii ? p.email : maskEmail(p.email);
  const requestId = searchParams.request && /^pr_[A-Za-z0-9_-]{8,20}$/.test(searchParams.request) ? searchParams.request : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-ink/65 hover:text-navy-800">← Customers</Link>
      <PageHeader title={shownName || shownEmail} intro={shownEmail} actions={p.shopify.length ? <Pill tone="good">Shopify customer</Pill> : <Pill>Site sign-up only</Pill>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title="Orders (Shopify)"><p className="text-2xl font-semibold">{p.shopify.reduce((n, c) => n + c.orders, 0)}</p></Panel>
        <Panel title="Spent (Shopify)">
          <p className="text-lg font-semibold">{formatPrice(p.shopify.reduce((n, c) => n + c.spentCents, 0), "USD")}</p>
        </Panel>
        <Panel title="Marketing emails">
          <p className="text-sm">{p.newsletter?.subscribed
            ? `Subscribed${p.newsletter.consentedAt ? ` (consent ${p.newsletter.consentedAt.slice(0, 10)}, ${p.newsletter.source ?? "site"}${p.newsletter.confirmedAt ? ", email confirmed" : ""})` : ""}`
            : p.newsletter?.pending
              ? `Waiting for email confirmation (signed up ${p.newsletter.requestedAt!.slice(0, 10)})`
              : "Not subscribed"}</p>
          {p.waitlist ? (
            <p className="text-sm mt-1">Launch waitlist: {p.waitlist.country} (consent {p.waitlist.consentedAt.slice(0, 10)}, wording {p.waitlist.consentVersion})</p>
          ) : null}
        </Panel>
      </div>

      {/* Health-related answers: only for roles that may see personal details. */}
      {pii && p.newsletter?.quiz && Object.keys(p.newsletter.quiz).length ? (
        <Panel title="Pre-order quiz answers">
          <dl className="text-sm grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {QUIZ_LABELS.filter((q) => p.newsletter?.quiz?.[q.key]).map((q) => (
              <div key={q.key}>
                <dt className="text-ink/55">{q.title}</dt>
                <dd>{quizAnswerLabel(q.key, p.newsletter!.quiz![q.key]!)}</dd>
              </div>
            ))}
          </dl>
          {p.newsletter.quizAt ? <p className="text-xs text-ink/55 mt-3">Saved {p.newsletter.quizAt.slice(0, 10)}</p> : null}
        </Panel>
      ) : null}

      <Panel title="Shopify">
        {p.shopify.length ? (
          <ul className="text-sm divide-y divide-cloud-300">
            {p.shopify.map((c) => (
              <li key={c.id} className="py-2 flex flex-wrap justify-between gap-2">
                <span>{pii ? c.name : maskName(c.name)} · {c.orders} order{c.orders === 1 ? "" : "s"}</span>
                <a className="underline text-navy-800" href={c.url} target="_blank" rel="noopener noreferrer">
                  Orders, subscriptions and addresses in Shopify
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">No Shopify customer with this email.</p>
        )}
      </Panel>

      {can(staff.role, "customers:export") || can(staff.role, "customers:delete") ? (
        <CustomerPrivacyActions
          k={searchParams.k!}
          canExport={can(staff.role, "customers:export")}
          canErase={can(staff.role, "customers:delete")}
          requestId={requestId}
        />
      ) : null}
    </div>
  );
}

import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listSubscriptionsByStatus } from "@/lib/data/subscriptions";
import { maskEmail } from "@/lib/admin/pii";
import { Empty, Notice, PageHeader, Table } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { SubscriptionRowActions } from "./SubscriptionRowActions";
import type { SubscriptionRecord, SubscriptionStatus } from "@/types/records";

export const metadata = { title: "Subscriptions" };

const GROUPS: Array<{ status: SubscriptionStatus; label: string }> = [
  { status: "past_due", label: "Payment due" },
  { status: "active", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "cancelled", label: "Cancelled" },
];

export default async function SubscriptionsPage() {
  const staff = await requireStaffPage("orders:read");
  const pii = can(staff.role, "customers:pii");
  const manage = can(staff.role, "subscriptions:manage");
  let data: Array<{ label: string; status: SubscriptionStatus; rows: SubscriptionRecord[] }> = [];
  let error = false;
  try {
    data = await Promise.all(GROUPS.map(async (g) => ({ ...g, rows: await listSubscriptionsByStatus(g.status) })));
  } catch (err) {
    console.error("[admin] subscriptions failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        intro="Stripe charges renewals automatically. Each paid renewal appears in Orders to ship. Changes here apply in Stripe immediately."
      />
      {error ? <Notice tone="bad">Subscriptions couldn't be loaded.</Notice> : null}
      {data.map((g) => (
        <section key={g.status} className="space-y-2">
          <h2 className="font-semibold text-navy-800">
            {g.label} ({g.rows.length})
          </h2>
          {g.rows.length === 0 ? (
            <Empty>None.</Empty>
          ) : (
            <Table head={["Customer", "Product", "Every", "Price", "Next charge", ""]} minWidth={760}>
              {g.rows.map((s) => (
                <tr key={s.subscriptionId}>
                  <td className="px-4 py-3">{pii ? s.email : maskEmail(s.email)}</td>
                  <td className="px-4 py-3">{s.productName}</td>
                  <td className="px-4 py-3">{s.cycleDays} days</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(s.priceCents, s.currency)}</td>
                  <td className="px-4 py-3">{g.status === "active" || g.status === "past_due" ? s.nextChargeDate?.slice(0, 10) ?? "" : ""}</td>
                  <td className="px-4 py-3 text-right">{manage && g.status !== "cancelled" ? <SubscriptionRowActions id={s.subscriptionId} status={g.status} /> : null}</td>
                </tr>
              ))}
            </Table>
          )}
        </section>
      ))}
    </div>
  );
}

import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listDiscounts } from "@/lib/data/discounts";
import { Empty, Notice, PageHeader, Panel } from "@/components/admin/ui";
import { DiscountCreate, DiscountRowActions } from "./DiscountClient";
import { formatPrice } from "@/lib/utils";
import type { DiscountRecord } from "@/types/records";

export const metadata = { title: "Discounts" };

function status(d: DiscountRecord, now = new Date()) {
  if (d.active !== "1") return "Inactive";
  if (d.expiresAt && new Date(d.expiresAt) <= now) return "Expired";
  if (d.startsAt && new Date(d.startsAt) > now) return "Scheduled";
  if (typeof d.maxUses === "number" && d.usesCount >= d.maxUses) return "Used up";
  return "Active";
}

export default async function DiscountsPage() {
  const staff = await requireStaffPage("orders:read");
  const writer = can(staff.role, "discounts:write");
  let codes: DiscountRecord[] = [];
  let error = false;
  try {
    codes = await listDiscounts();
  } catch (err) {
    console.error("[admin] discounts failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        intro="Codes customers enter at checkout. The pre-order discount is separate (Pre-orders page) and the two add together."
      />
      {error ? <Notice tone="bad">Codes couldn't be loaded.</Notice> : null}
      {writer ? <DiscountCreate /> : null}
      <Panel title="Codes">
        {codes.length === 0 ? (
          <Empty>No codes yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="py-2">Code</th>
                  <th className="py-2">Value</th>
                  <th className="py-2">Rules</th>
                  <th className="py-2">Used</th>
                  <th className="py-2">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud-300">
                {codes.map((d) => (
                  <tr key={d.code}>
                    <td className="py-2 font-mono">{d.code}</td>
                    <td className="py-2">{d.type === "percentage" ? `${d.value}% off` : formatPrice(d.value, d.currency ?? "USD") + " off"}</td>
                    <td className="py-2 text-xs text-ink/65">
                      {[
                        d.minSubtotalCents ? `min ${formatPrice(d.minSubtotalCents, d.currency ?? "USD")}` : null,
                        d.maxUses ? `max ${d.maxUses} uses` : null,
                        d.perCustomerLimit ? `${d.perCustomerLimit} per customer` : null,
                        d.startsAt ? `from ${d.startsAt.slice(0, 10)}` : null,
                        d.expiresAt ? `until ${d.expiresAt.slice(0, 10)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No limits"}
                    </td>
                    <td className="py-2 tabular-nums">{d.usesCount}</td>
                    <td className="py-2">{status(d)}</td>
                    <td className="py-2 text-right">{writer ? <DiscountRowActions code={d.code} active={d.active === "1"} used={d.usesCount > 0} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { getOrder } from "@/lib/data/orders";
import { audit } from "@/lib/data/audit";
import { orderDetail, STATUS_LABEL, STATUS_TONE } from "@/lib/admin/views";
import { sealEmail } from "@/lib/admin/seal";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "./OrderActions";

export const metadata = { title: "Order" };

export default async function AdminOrderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const staff = await requireStaffPage("orders:read");
  if (!/^IP6-[A-Z0-9]{6,20}$/.test(params.id)) notFound();
  const raw = await getOrder(params.id);
  if (!raw) notFound();
  const pii = can(staff.role, "customers:pii");
  if (pii) await audit(staff.actor, "order.view", raw.orderId, undefined, staff.ip);
  const o = orderDetail(raw, staff.role);
  const money = (c: number) => formatPrice(c, o.currency);
  const customerLink = pii && !raw.anonymizedAt ? `/admin/customers/view?k=${encodeURIComponent(sealEmail(raw.email))}` : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-ink/65 hover:text-navy-800">← Orders</Link>
      <PageHeader
        title={o.orderId}
        intro={
          <>
            Placed {o.createdAt.replace("T", " ").slice(0, 16)} UTC{o.paidAt ? ` · paid ${o.paidAt.replace("T", " ").slice(0, 16)}` : ""}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            {o.preorder === "1" ? <Pill tone="info">Pre-order</Pill> : null}
            <Pill tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Pill>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-cloud-300 text-sm">
              {o.items.map((l, i) => (
                <li key={l.variantId + i} className="py-2 flex justify-between gap-4">
                  <span>
                    <span className="font-medium">{l.name}</span> · {l.variantLabel} × {l.qty}
                    <span className="block text-xs text-ink/55">
                      {l.sku}
                      {l.discountPct ? ` · ${l.discountPct}% off` : ""}
                      {l.subscriptionCycleDays ? ` · subscription every ${l.subscriptionCycleDays} days` : l.preorder ? " · pre-order" : ""}
                    </span>
                  </span>
                  <span className="tabular-nums">{money(l.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 border-t border-cloud-300 pt-4 text-sm space-y-1">
              <Row k="Subtotal" v={money(o.subtotalCents)} />
              {o.discountCents ? <Row k={`Discount ${o.discountCode ?? ""}`} v={`−${money(o.discountCents)}`} /> : null}
              <Row k={`Shipping (${o.shippingLabel})`} v={o.shippingCents ? money(o.shippingCents) : "Free"} />
              {o.taxCents ? <Row k="Tax" v={money(o.taxCents)} /> : null}
              <Row k={<strong>Total charged</strong>} v={<strong>{money(o.totalCents)}</strong>} />
              {o.refundedCents ? <Row k="Refunded" v={money(o.refundedCents)} /> : null}
            </dl>
          </Panel>

          {o.fulfillment ? (
            <Panel title="Shipment">
              <p className="text-sm">
                {o.fulfillment.carrier} · {o.fulfillment.trackingNumber}
                {o.fulfillment.trackingUrl ? (
                  <>
                    {" · "}
                    <a href={o.fulfillment.trackingUrl} className="underline" target="_blank" rel="noopener noreferrer">Track</a>
                  </>
                ) : null}
              </p>
              <p className="text-xs text-ink/55 mt-1">Shipped {o.fulfillment.shippedAt.replace("T", " ").slice(0, 16)} UTC by {o.fulfillment.shippedBy}</p>
            </Panel>
          ) : null}

          {o.refunds?.length ? (
            <Panel title="Refunds">
              <ul className="text-sm space-y-1">
                {o.refunds.map((r) => (
                  <li key={r.refundId}>
                    {money(r.amountCents)} · {r.createdAt.slice(0, 10)} · {r.createdBy}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Notes">
            {o.notes?.length ? (
              <ul className="space-y-2 text-sm">
                {o.notes.map((n, i) => (
                  <li key={i} className="border-l-2 border-cloud-300 pl-3">
                    <p>{n.text}</p>
                    <p className="text-xs text-ink/55">{n.at.replace("T", " ").slice(0, 16)} · {n.by}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/60">No notes.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            {raw.anonymizedAt ? (
              <p className="text-sm text-ink/60">Personal data erased on request ({raw.anonymizedAt.slice(0, 10)}).</p>
            ) : (
              <div className="text-sm space-y-1">
                <p className="font-medium">{o.customerName}</p>
                <p>{o.email}</p>
                {o.phone ? <p>{o.phone}</p> : null}
                <p className="pt-2 leading-relaxed">
                  {o.shippingAddress.line1}
                  {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
                  <br />
                  {o.shippingAddress.city}
                  {o.shippingAddress.region ? `, ${o.shippingAddress.region}` : ""} {o.shippingAddress.postalCode}
                  <br />
                  {o.shippingAddress.country}
                </p>
                {customerLink ? (
                  <Link href={customerLink} className="inline-block pt-2 underline text-navy-800">View customer</Link>
                ) : null}
                {!pii ? <p className="pt-2 text-xs text-ink/55">Your role shows masked contact details.</p> : null}
              </div>
            )}
          </Panel>

          <OrderActions
            orderId={o.orderId}
            status={o.status}
            currency={o.currency}
            refundableCents={o.totalCents - (o.refundedCents ?? 0)}
            canFulfil={can(staff.role, "orders:fulfill")}
            canRefund={can(staff.role, "orders:refund")}
          />

          {raw.stripePaymentIntentId && can(staff.role, "orders:refund") ? (
            <p className="text-xs text-ink/55">
              Stripe payment:{" "}
              <a
                className="underline"
                href={`https://dashboard.stripe.com/payments/${encodeURIComponent(raw.stripePaymentIntentId)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {raw.stripePaymentIntentId}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/65">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

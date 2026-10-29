import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getMyOrder, ORDER_STATUS_LABEL } from "@/lib/data/myorders";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getSessionUser();
  if (!user) redirect("/account/login?next=/account/orders");
  const o = await getMyOrder(user, params.id).catch(() => null);
  // Someone else's order looks exactly like a missing one.
  if (!o) notFound();
  const money = (c: number) => formatPrice(c, o.currency);

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm text-ink/70 hover:text-forest-700">
        ← All orders
      </Link>
      <header>
        <h2 className="font-display text-display-md text-forest-800">Order {o.orderId}</h2>
        <p className="text-sm text-ink/70 mt-1">
          Placed {formatDate(o.createdAt)} · {ORDER_STATUS_LABEL[o.status]}
        </p>
      </header>

      {o.fulfillment ? (
        <section className="card p-6">
          <h3 className="font-medium text-forest-800 mb-1">Shipping</h3>
          <p className="text-sm text-ink/75">
            Shipped {formatDate(o.fulfillment.shippedAt)} with {o.fulfillment.carrier} · Tracking {o.fulfillment.trackingNumber}
          </p>
          {o.fulfillment.trackingUrl ? (
            <a href={o.fulfillment.trackingUrl} className="text-sm underline text-forest-700" rel="noopener noreferrer" target="_blank">
              Track package
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="card p-6">
        <h3 className="font-medium text-forest-800 mb-3">Items</h3>
        <ul className="divide-y divide-ivory-300 text-sm">
          {o.items.map((l, i) => (
            <li key={l.variantId + i} className="py-2 flex justify-between gap-4">
              <span>
                {l.name} · {l.variantLabel} × {l.qty}
                {l.subscriptionCycleDays ? ` · every ${l.subscriptionCycleDays} days` : l.preorder ? " · pre-order" : ""}
              </span>
              <span>{money(l.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 border-t border-ivory-300 pt-4 text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-ink/70">Subtotal</dt><dd>{money(o.subtotalCents)}</dd></div>
          {o.discountCents ? <div className="flex justify-between"><dt className="text-ink/70">Discount</dt><dd>−{money(o.discountCents)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-ink/70">Shipping</dt><dd>{o.shippingCents ? money(o.shippingCents) : "Free"}</dd></div>
          {o.taxCents ? <div className="flex justify-between"><dt className="text-ink/70">Tax</dt><dd>{money(o.taxCents)}</dd></div> : null}
          <div className="flex justify-between font-medium"><dt>Total</dt><dd>{money(o.totalCents)}</dd></div>
          {o.refundedCents ? <div className="flex justify-between text-forest-700"><dt>Refunded</dt><dd>{money(o.refundedCents)}</dd></div> : null}
        </dl>
      </section>

      <section className="card p-6">
        <h3 className="font-medium text-forest-800 mb-2">Shipping address</h3>
        <p className="text-sm text-ink/75 leading-relaxed">
          {o.shippingAddress.name}<br />
          {o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}<br />
          {o.shippingAddress.city}{o.shippingAddress.region ? `, ${o.shippingAddress.region}` : ""} {o.shippingAddress.postalCode}<br />
          {o.shippingAddress.country}
        </p>
      </section>

      <p className="text-sm text-ink/70">
        Questions about this order? Use our <a href="/contact" className="underline text-forest-700">contact form</a> and include the order number.
      </p>
    </div>
  );
}

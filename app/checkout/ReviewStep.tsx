"use client";

import type { Address, CartLine, Currency } from "@/types";
import type { ShippingRate } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

export function ReviewStep({
  email,
  address,
  items,
  rate,
  currency,
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  onBack,
  onPlaceOrder,
}: {
  email: string;
  address: Address;
  items: CartLine[];
  rate: ShippingRate;
  currency: Currency;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  onBack: () => void;
  onPlaceOrder: () => void;
}) {
  return (
    <div className="card p-6 lg:p-8 space-y-6">
      <h2 className="font-display text-xl text-forest-800">Review your order</h2>

      <section>
        <h3 className="font-medium text-forest-800 mb-2">Contact</h3>
        <p className="text-sm text-ink/75">{email}</p>
      </section>

      <section>
        <h3 className="font-medium text-forest-800 mb-2">Shipping to</h3>
        <p className="text-sm text-ink/75 leading-relaxed">
          {address.name}<br />
          {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
          {address.city}, {address.region} {address.postalCode}<br />
          {address.country}
        </p>
      </section>

      <section>
        <h3 className="font-medium text-forest-800 mb-2">Shipping method</h3>
        <p className="text-sm text-ink/75">
          {rate.label} · {rate.carrier} · {rate.etaDays[0]}–{rate.etaDays[1]} business days — {formatPrice(shippingCents, currency)}
        </p>
      </section>

      <section>
        <h3 className="font-medium text-forest-800 mb-2">Items</h3>
        <ul className="divide-y divide-ivory-300 text-sm">
          {items.map((l) => (
            <li key={l.variantId + (l.subscription ? "-sub" : "")} className="py-2 flex justify-between">
              <span>{l.name} · {l.variantLabel} × {l.qty}</span>
              <span>{formatPrice(l.unitPriceCents * l.qty, l.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-ivory-300 pt-4 space-y-1 text-sm">
        <Row label="Subtotal" value={formatPrice(subtotalCents, currency)} />
        <Row label="Shipping" value={formatPrice(shippingCents, currency)} />
        <Row label="Tax" value={formatPrice(taxCents, currency)} />
        <div className="pt-2 border-t border-ivory-300 mt-2">
          <Row label={<strong>Total</strong>} value={<strong>{formatPrice(totalCents, currency)}</strong>} />
        </div>
      </section>

      <label className="flex items-start gap-2 text-sm text-ink/75">
        <input type="checkbox" required className="mt-1 accent-forest-700" />
        <span>
          I agree to the <a href="/legal/terms" className="underline text-forest-700">Terms of Service</a> and understand that subscription items renew automatically on the cycle I chose.
        </span>
      </label>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="btn-ghost">Back</button>
        <button onClick={onPlaceOrder} className="btn-primary">Place order</button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}

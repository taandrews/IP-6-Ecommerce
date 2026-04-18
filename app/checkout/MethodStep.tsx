"use client";

import { useEffect, useState } from "react";
import type { Address, CartLine, Currency } from "@/types";
import type { ShippingRate } from "@/lib/shipping";
import { cn, formatPrice } from "@/lib/utils";

export function MethodStep({
  address,
  items,
  currency,
  onContinue,
  onBack,
}: {
  address: Address;
  items: CartLine[];
  currency: Currency;
  onContinue: (r: ShippingRate) => void;
  onBack: () => void;
}) {
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, destinationCountry: address.country, destinationPostal: address.postalCode, currency }),
        });
        const data = await res.json();
        if (!data.rates || data.rates.length === 0) {
          setError(
            "We can't ship one or more items in your cart to this destination. See our International Shipping page for details.",
          );
          setRates([]);
        } else {
          setRates(data.rates);
          setSelected(data.rates[0]!.id);
        }
      } catch {
        setError("We couldn't calculate shipping rates. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [address.country, address.postalCode, currency, items]);

  function submit() {
    const rate = rates?.find((r) => r.id === selected);
    if (rate) onContinue(rate);
  }

  return (
    <div className="card p-6 lg:p-8">
      <h2 className="font-display text-xl text-forest-800 mb-5">Shipping method</h2>
      {loading ? <p className="text-ink/70">Calculating rates…</p> : null}
      {error ? <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3">{error}</p> : null}
      {rates && rates.length > 0 ? (
        <ul className="space-y-3">
          {rates.map((r) => {
            const active = selected === r.id;
            return (
              <li key={r.id}>
                <label
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer transition-colors",
                    active ? "border-forest-700 bg-forest-50" : "border-ivory-300",
                  )}
                >
                  <input
                    type="radio"
                    name="shipping-method"
                    value={r.id}
                    checked={active}
                    onChange={() => setSelected(r.id)}
                    className="accent-forest-700"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-ink/60">
                      {r.carrier} · {r.etaDays[0]}–{r.etaDays[1]} business days
                    </div>
                  </div>
                  <div className="font-medium">{formatPrice(r.amountCents, r.currency)}</div>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="pt-6 flex justify-between">
        <button onClick={onBack} className="btn-ghost">Back</button>
        <button onClick={submit} disabled={!selected} className="btn-primary">Continue to payment</button>
      </div>
    </div>
  );
}

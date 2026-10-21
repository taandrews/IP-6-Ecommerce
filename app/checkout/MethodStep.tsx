"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address, CartLine, Currency } from "@/types";
import type { ShippingRate } from "@/lib/shipping";
import { cn, formatPrice } from "@/lib/utils";
import type { ClientQuote } from "./types";

export function requestedLines(items: CartLine[]) {
  return items.map((l) => ({
    variantId: l.variantId,
    qty: l.qty,
    ...(l.subscription ? { subscriptionCycleDays: l.subscription.cycleDays } : {}),
  }));
}

/**
 * Delivery and review: shipping options, an optional discount code and the
 * final totals, all calculated by the server.
 */
export function MethodStep({
  email,
  address,
  items,
  currency,
  onQuote,
  onContinue,
  onBack,
  busy,
}: {
  email: string;
  address: Address;
  items: CartLine[];
  currency: Currency;
  onQuote: (q: ClientQuote | null) => void;
  onContinue: (rateId: string, discountCode: string | null) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<ClientQuote | null>(null);

  const load = useCallback(
    async (rateId: string | null, discountCode: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            address,
            items: requestedLines(items),
            currency,
            ...(rateId ? { shippingRateId: rateId } : {}),
            ...(discountCode ? { discountCode } : {}),
          }),
        });
        const data = (await res.json()) as { quote?: ClientQuote; rates?: ShippingRate[]; error?: string; discountMessage?: string };
        setRates(data.rates ?? []);
        setCodeMessage(data.discountMessage ?? null);
        if (!res.ok || !data.quote) {
          setError(data.error ?? "We couldn't calculate your total. Please try again.");
          setQuote(null);
          onQuote(null);
          return;
        }
        setQuote(data.quote);
        onQuote(data.quote);
        setSelected(data.quote.shipping.id);
        setAppliedCode(data.quote.discountCode ?? null);
      } catch {
        setError("We couldn't calculate your total. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [address, currency, email, items, onQuote],
  );

  useEffect(() => {
    void load(null, null);
    // Only on entering the step; later changes call load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card p-6 lg:p-8 space-y-6">
      <h2 className="font-display text-xl text-forest-800">Delivery and review</h2>

      {error ? <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">{error}</p> : null}

      {rates && rates.length > 0 ? (
        <fieldset>
          <legend className="font-medium text-forest-800 mb-3">Shipping method</legend>
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
                      disabled={loading}
                      onChange={() => {
                        setSelected(r.id);
                        void load(r.id, appliedCode);
                      }}
                      className="accent-forest-700"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-ink/60">
                        {r.carrier} · {r.etaDays[0]}–{r.etaDays[1]} business days
                      </div>
                    </div>
                    <div className="font-medium">{r.amountCents === 0 ? "Free" : formatPrice(r.amountCents, r.currency)}</div>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : loading ? (
        <p className="text-ink/70">Calculating shipping…</p>
      ) : null}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim();
          void load(selected, c || null);
        }}
      >
        <label htmlFor="discount-code" className="label">Discount code</label>
        <div className="flex gap-2">
          <input
            id="discount-code"
            className="input flex-1 uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={32}
            autoComplete="off"
          />
          <button type="submit" className="btn-secondary" disabled={loading || !code.trim()}>Apply</button>
          {appliedCode ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setCode("");
                setAppliedCode(null);
                void load(selected, null);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        {appliedCode ? <p className="text-sm text-forest-700">Code {appliedCode} applied.</p> : null}
        {codeMessage ? <p className="text-sm text-danger" role="status">{codeMessage}</p> : null}
      </form>

      {quote ? (
        <section className="border-t border-ivory-300 pt-4">
          <h3 className="font-medium text-forest-800 mb-2">Shipping to</h3>
          <p className="text-sm text-ink/75 leading-relaxed">
            {address.name}<br />
            {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
            {address.city}{address.region ? `, ${address.region}` : ""} {address.postalCode}<br />
            {address.country}
          </p>
          {quote.hasSubscription ? (
            <p className="mt-4 text-sm text-ink/75">
              Subscription items renew automatically at the price shown, plus standard shipping, every cycle until you cancel. We email a
              reminder before each renewal. You can skip, pause or cancel any time from your account.
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="pt-2 flex justify-between">
        <button onClick={onBack} className="btn-ghost" disabled={busy}>Back</button>
        <button
          onClick={() => selected && onContinue(selected, appliedCode)}
          disabled={!selected || !quote || loading || busy}
          className="btn-primary"
        >
          {busy ? "Preparing payment…" : "Continue to payment"}
        </button>
      </div>
    </div>
  );
}

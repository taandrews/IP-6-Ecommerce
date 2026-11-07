"use client";

import { useEffect, useRef, useState } from "react";
import { PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { Lock } from "lucide-react";

/**
 * Payment through the order's Stripe Checkout Session. Everything charged
 * (items, discount, shipping, tax) was set on the session by the server; this
 * step only collects the payment method and confirms. The amount shown is the
 * session's own total, so it is exactly what Stripe charges.
 */
export function PaymentStep({ preorder, onBack, onPaid }: { preorder: boolean; onBack: () => void; onPaid: () => void }) {
  const state = useCheckoutElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = state.type === "success" ? state.checkout : null;

  // The server set the shipping address on the session, but Stripe.js only
  // counts it once it has been applied through runServerUpdate (without it,
  // confirm fails with "A shipping address is required"). It runs in the
  // background while the shopper types their card; Pay waits for it only if
  // it hasn't finished. The browser sends only the session id.
  const shipping = useRef<{ id: string; done: Promise<boolean> } | null>(null);
  useEffect(() => {
    // Once per session: each update gives the hook a new checkout object.
    if (!loaded || shipping.current?.id === loaded.id) return;
    shipping.current = {
      id: loaded.id,
      done: loaded
        .runServerUpdate(() =>
          fetch("/api/checkout/session", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: loaded.id }) }).then((r) => {
            if (!r.ok) throw new Error(`shipping ${r.status}`);
          }),
        )
        .then((res) => res.type !== "error")
        .catch(() => false),
    };
  }, [loaded]);

  if (state.type === "error") {
    return (
      <div className="card p-6 lg:p-8 space-y-4">
        <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">
          Payment couldn&apos;t load. Please go back and try again.
        </p>
        <button type="button" onClick={onBack} className="btn-ghost">Back</button>
      </div>
    );
  }
  const checkout = state.type === "success" ? state.checkout : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkout) return;
    setLoading(true);
    setError(null);
    // Stays on this page unless the bank needs a redirect (for example 3-D Secure);
    // then the session's return URL brings the shopper back to the confirmation.
    try {
      if (!(await shipping.current?.done)) {
        setError("Payment couldn't load your shipping details. Please go back and try again.");
        return;
      }
      const result = await checkout.confirm({ redirect: "if_required" });
      if (result.type === "error") setError(result.error.message || "Payment failed. Please try another card.");
      else onPaid();
    } catch (err) {
      console.error("[checkout] confirm failed", (err as Error).message);
      setError("Payment couldn't be completed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  const label = preorder ? "Pre Order Now" : "Place order";
  return (
    <form onSubmit={submit} className="card p-6 lg:p-8 space-y-5" aria-busy={!checkout}>
      <h2 className="font-display text-xl text-forest-800">Payment</h2>
      <div className="flex items-center gap-2 text-xs text-ink/65">
        <Lock className="size-3.5" /> Card details go straight to Stripe. IP6 Original never sees or stores them.
      </div>
      {checkout ? null : (
        // Holds the space while Stripe loads, so the page doesn't jump and the shopper sees progress.
        <div className="space-y-3" role="status" aria-label="Loading secure payment form">
          <div className="h-12 rounded-md bg-cloud-200 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-md bg-cloud-200 animate-pulse" />
            <div className="h-12 rounded-md bg-cloud-200 animate-pulse" />
          </div>
          <p className="text-sm text-ink/60">Loading secure payment…</p>
        </div>
      )}
      <PaymentElement />
      {error ? (
        <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-ink/60">
        By placing your order you agree to our <a href="/legal/terms" className="underline">Terms</a> and acknowledge our{" "}
        <a href="/legal/privacy" className="underline">Privacy Policy</a>. All sales are final once shipped.
      </p>
      <div className="pt-2 flex justify-between">
        <button type="button" onClick={onBack} className="btn-ghost" disabled={loading}>Back</button>
        <button type="submit" disabled={!checkout || loading} className="btn-primary">
          {loading ? "Processing…" : `${label} · ${checkout ? checkout.total.total.amount : "…"}`}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ClientQuote } from "./types";

export function PaymentStep({
  orderId,
  quote,
  onBack,
  onPaid,
}: {
  orderId: string;
  quote: ClientQuote;
  onBack: () => void;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Used only when the bank needs a redirect (for example 3-D Secure).
        return_url: `${window.location.origin}/checkout?step=confirmation&order=${encodeURIComponent(orderId)}`,
      },
      redirect: "if_required",
    });
    setLoading(false);
    if (confirmError) setError(confirmError.message ?? "Payment failed. Please try another card.");
    else onPaid();
  }

  return (
    <form onSubmit={submit} className="card p-6 lg:p-8 space-y-5">
      <h2 className="font-display text-xl text-forest-800">Payment</h2>
      <div className="flex items-center gap-2 text-xs text-ink/65">
        <Lock className="size-3.5" /> Card details go straight to Stripe. IP6 Original never sees or stores them.
      </div>
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
        <button type="submit" disabled={!stripe || loading} className="btn-primary">
          {loading ? "Processing…" : `Pre Order Now · ${formatPrice(quote.totalCents, quote.currency)}`}
        </button>
      </div>
    </form>
  );
}

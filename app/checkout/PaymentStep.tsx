"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";

export function PaymentStep({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
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
        return_url: `${window.location.origin}/checkout?step=confirmation`,
      },
      redirect: "if_required",
    });
    setLoading(false);
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
    } else {
      onContinue();
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 lg:p-8 space-y-5">
      <h2 className="font-display text-xl text-forest-800">Payment</h2>
      <div className="flex items-center gap-2 text-xs text-ink/65">
        <Lock className="size-3.5" /> Your payment info is secured and encrypted by Stripe.
      </div>
      <PaymentElement />
      {error ? (
        <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">
          {error}
        </p>
      ) : null}
      <div className="pt-2 flex justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">Back</button>
        <button type="submit" disabled={!stripe || loading} className="btn-primary">
          {loading ? "Processing…" : "Review order"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/components/cart/CartStore";
import { getStripe } from "@/lib/stripe/client";
import { formatPrice, cn } from "@/lib/utils";
import type { Address, CartLine } from "@/types";
import { ShippingStep } from "./ShippingStep";
import { MethodStep } from "./MethodStep";
import { PaymentStep } from "./PaymentStep";
import { ReviewStep } from "./ReviewStep";
import { ConfirmationStep } from "./ConfirmationStep";
import type { ShippingRate } from "@/lib/shipping";

type Step = "shipping" | "method" | "payment" | "review" | "confirmation";

const ORDER: Step[] = ["shipping", "method", "payment", "review", "confirmation"];

export function CheckoutFlow() {
  const { lines, subtotalCents, clear } = useCart();
  const [step, setStep] = useState<Step>("shipping");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [rate, setRate] = useState<ShippingRate | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const currency = lines[0]?.currency ?? "USD";
  const shippingCents = rate?.amountCents ?? 0;
  const estimatedTaxCents = Math.round(subtotalCents * 0.075);
  const totalCents = subtotalCents + shippingCents + estimatedTaxCents;
  const stepIndex = ORDER.indexOf(step);

  if (lines.length === 0 && step !== "confirmation") {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-display-lg text-forest-800 mb-4">Your cart is empty</h1>
        <p className="text-ink/70 mb-6">Add a product to begin checkout.</p>
        <Link href="/shop" className="btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink/70 hover:text-forest-700 mb-8">
        <ArrowLeft className="size-4" /> Continue shopping
      </Link>
      <div className="grid lg:grid-cols-[1fr_420px] gap-10">
        <div>
          <Stepper current={stepIndex} />

          <div className="mt-8">
            {step === "shipping" ? (
              <ShippingStep
                email={email}
                onEmail={setEmail}
                address={address}
                onContinue={(addr) => {
                  setAddress(addr);
                  setStep("method");
                }}
              />
            ) : null}
            {step === "method" && address ? (
              <MethodStep
                address={address}
                items={lines}
                currency={currency}
                onBack={() => setStep("shipping")}
                onContinue={async (r) => {
                  setRate(r);
                  // Create PaymentIntent
                  try {
                    const res = await fetch("/api/checkout/intent", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email,
                        address,
                        items: lines,
                        shipping: r,
                        currency,
                      }),
                    });
                    const data = await res.json();
                    setClientSecret(data.clientSecret);
                    setOrderId(data.orderId);
                    setStep("payment");
                  } catch {
                    /* noop — user can retry */
                  }
                }}
              />
            ) : null}
            {step === "payment" && clientSecret ? (
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#1B4332",
                      colorText: "#1A1A1A",
                      fontFamily: "Inter, system-ui, sans-serif",
                      borderRadius: "6px",
                    },
                  },
                }}
              >
                <PaymentStep
                  onBack={() => setStep("method")}
                  onContinue={() => setStep("review")}
                />
              </Elements>
            ) : null}
            {step === "review" && address && rate ? (
              <ReviewStep
                email={email}
                address={address}
                items={lines}
                rate={rate}
                currency={currency}
                subtotalCents={subtotalCents}
                shippingCents={shippingCents}
                taxCents={estimatedTaxCents}
                totalCents={totalCents}
                onBack={() => setStep("payment")}
                onPlaceOrder={() => {
                  clear();
                  setStep("confirmation");
                }}
              />
            ) : null}
            {step === "confirmation" ? (
              <ConfirmationStep email={email} orderId={orderId} />
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit card p-6">
          <h2 className="font-display text-lg text-forest-800 mb-4">Order summary</h2>
          <ul className="divide-y divide-ivory-300">
            {lines.map((line) => (
              <li key={line.variantId + (line.subscription ? "-sub" : "")} className="flex gap-3 py-4">
                <div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-ivory-200">
                  <Image src={line.image} alt={line.name} fill sizes="64px" className="object-cover" />
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-forest-800 text-ivory-100 grid place-items-center text-[10px] font-bold">
                    {line.qty}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-forest-800 truncate">{line.name}</p>
                  <p className="text-xs text-ink/60">{line.variantLabel}</p>
                  {line.subscription ? (
                    <p className="text-xs text-gold-500 mt-0.5">
                      Every {line.subscription.cycleDays} d · {line.subscription.discountPct}% off
                    </p>
                  ) : null}
                </div>
                <div className="text-sm font-medium">
                  {formatPrice(
                    Math.round(
                      line.unitPriceCents *
                        line.qty *
                        (1 - (line.subscription?.discountPct ?? 0) / 100),
                    ),
                    line.currency,
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-ivory-300 pt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotalCents, currency)} />
            <Row label="Shipping" value={rate ? formatPrice(shippingCents, currency) : "Calculated next step"} />
            <Row label="Est. tax" value={formatPrice(estimatedTaxCents, currency)} />
            <div className="border-t border-ivory-300 pt-3 mt-3">
              <Row
                label={<strong>Total</strong>}
                value={<strong>{formatPrice(totalCents, currency)}</strong>}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink/60 mt-4">
            <Lock className="size-3.5" /> Secure checkout via Stripe
          </div>
        </aside>
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

function Stepper({ current }: { current: number }) {
  const labels = ["Shipping", "Method", "Payment", "Review", "Confirmation"];
  return (
    <ol className="flex items-center gap-3 overflow-x-auto scrollbar-none">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-3 text-sm whitespace-nowrap">
            <span
              className={cn(
                "grid place-items-center size-7 rounded-full text-xs font-medium",
                done && "bg-forest-700 text-ivory-100",
                active && "bg-gold-400 text-forest-900",
                !done && !active && "bg-ivory-200 text-ink/60",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-ink/75", active && "text-forest-800 font-medium")}>{label}</span>
            {i < labels.length - 1 ? <span className="text-ink/30">—</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/components/cart/CartStore";
import { usePreorder } from "@/components/store/StoreSettings";
import { getStripe } from "@/lib/stripe/client";
import { formatPrice, cn } from "@/lib/utils";
import type { Address } from "@/types";
import { ShippingStep } from "./ShippingStep";
import { MethodStep, requestedLines } from "./MethodStep";
import { PaymentStep } from "./PaymentStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { isPreorderLine, lineTotalCents } from "@/lib/preorder";
import type { ClientQuote } from "./types";

type Step = "shipping" | "method" | "payment" | "confirmation";
const ORDER: Step[] = ["shipping", "method", "payment", "confirmation"];

export function CheckoutFlow({ signedIn }: { signedIn: boolean }) {
  const params = useSearchParams();
  const { lines, clear } = useCart();
  const preorder = usePreorder();
  const returning = params.get("step") === "confirmation" && params.get("redirect_status") === "succeeded";
  const [step, setStep] = useState<Step>(returning ? "confirmation" : "shipping");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [quote, setQuote] = useState<ClientQuote | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(returning ? params.get("order") : null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Back from a bank redirect (3-D Secure) with a successful payment.
  useEffect(() => {
    if (returning) clear();
  }, [returning, clear]);

  const currency = lines[0]?.currency ?? "USD";
  const estimateCents = lines.reduce((s, l) => s + lineTotalCents(l, preorder), 0);
  // What the items cost at list price, so the discount shows as its own line.
  const listCents = quote ? quote.lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0) : lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);
  const savingsCents = listCents - (quote?.subtotalCents ?? estimateCents);
  const onlyPreorderSavings = quote ? quote.lines.every((l) => !l.discountPct || l.preorder) : lines.every((l) => !l.subscription);
  const stepIndex = ORDER.indexOf(step);
  const onQuote = useCallback((q: ClientQuote | null) => setQuote(q), []);

  if (lines.length === 0 && step !== "confirmation") {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-display-lg text-forest-800 mb-4">Your cart is empty</h1>
        <p className="text-ink/70 mb-6">Add a product to begin checkout.</p>
        <Link href="/shop" className="btn-primary">Browse products</Link>
      </div>
    );
  }

  async function startPayment(rateId: string, discountCode: string | null) {
    if (!address) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          address,
          items: requestedLines(lines),
          currency,
          shippingRateId: rateId,
          ...(discountCode ? { discountCode } : {}),
        }),
      });
      const data = (await res.json()) as { clientSecret?: string; orderId?: string; quote?: ClientQuote; error?: string };
      if (!res.ok || !data.clientSecret || !data.orderId || !data.quote) {
        setStartError(data.error ?? "We couldn't start payment. Please try again.");
        return;
      }
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setQuote(data.quote);
      setStep("payment");
    } catch {
      setStartError("We couldn't start payment. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="container py-10">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink/70 hover:text-forest-700 mb-8">
        <ArrowLeft className="size-4" /> Continue shopping
      </Link>
      <div className="grid lg:grid-cols-[1fr_420px] gap-10">
        <div>
          <Stepper current={stepIndex} />
          <div className="mt-8 space-y-4">
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
              <>
                <MethodStep
                  email={email}
                  address={address}
                  items={lines}
                  currency={currency}
                  onQuote={onQuote}
                  busy={starting}
                  onBack={() => setStep("shipping")}
                  onContinue={startPayment}
                />
                {startError ? <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">{startError}</p> : null}
              </>
            ) : null}
            {step === "payment" && clientSecret && quote && orderId ? (
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#0B1F3A",
                      colorText: "#0B1F3A",
                      fontFamily: "IBM Plex Sans, system-ui, sans-serif",
                      borderRadius: "6px",
                    },
                  },
                }}
              >
                <PaymentStep
                  orderId={orderId}
                  quote={quote}
                  onBack={() => {
                    setClientSecret(null);
                    setStep("method");
                  }}
                  onPaid={() => {
                    clear();
                    setStep("confirmation");
                  }}
                />
              </Elements>
            ) : null}
            {step === "confirmation" ? <ConfirmationStep email={email} orderId={orderId} signedIn={signedIn} /> : null}
          </div>
        </div>

        {step !== "confirmation" ? (
          <aside className="lg:sticky lg:top-24 h-fit card p-6">
            <h2 className="font-display text-lg text-forest-800 mb-4">Order summary</h2>
            <ul className="divide-y divide-ivory-300">
              {(quote?.lines ?? null)
                ? quote!.lines.map((l, i) => (
                    <li key={l.variantId + i} className="flex gap-3 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-800 truncate">{l.name} × {l.qty}</p>
                        <p className="text-xs text-ink/60">{l.variantLabel}</p>
                        {l.subscriptionCycleDays ? (
                          <p className="text-xs text-gold-500 mt-0.5">Every {l.subscriptionCycleDays} days · {l.discountPct}% off</p>
                        ) : l.preorder ? (
                          <p className="text-xs text-gold-500 mt-0.5">{preorder.label} · {l.discountPct}% off</p>
                        ) : null}
                      </div>
                      <div className="text-sm font-medium">
                        {l.discountPct ? <s className="mr-2 font-normal text-ink/50">{formatPrice(l.unitPriceCents * l.qty, quote!.currency)}</s> : null}
                        {formatPrice(l.lineTotalCents, quote!.currency)}
                      </div>
                    </li>
                  ))
                : lines.map((line) => (
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
                          <p className="text-xs text-gold-500 mt-0.5">Every {line.subscription.cycleDays} days · {line.subscription.discountPct}% off</p>
                        ) : isPreorderLine(line, preorder) ? (
                          <p className="text-xs text-gold-500 mt-0.5">{preorder.label} · {preorder.discountPct}% off</p>
                        ) : null}
                      </div>
                      <div className="text-sm font-medium">
                        {lineTotalCents(line, preorder) < line.unitPriceCents * line.qty ? <s className="mr-2 font-normal text-ink/50">{formatPrice(line.unitPriceCents * line.qty, line.currency)}</s> : null}
                        {formatPrice(lineTotalCents(line, preorder), line.currency)}
                      </div>
                    </li>
                  ))}
            </ul>
            <div className="border-t border-ivory-300 pt-4 space-y-2 text-sm">
              {savingsCents > 0 ? (
                <>
                  <Row label="Items" value={formatPrice(listCents, currency)} />
                  <Row label={<span className="text-gold-700">{onlyPreorderSavings ? `${preorder.label} discount (${preorder.discountPct}% off)` : "Discounts"}</span>} value={<span className="text-gold-700">−{formatPrice(savingsCents, currency)}</span>} />
                </>
              ) : null}
              <Row label="Subtotal" value={formatPrice(quote?.subtotalCents ?? estimateCents, currency)} />
              {quote?.discountCents ? <Row label={`Discount (${quote.discountCode})`} value={`−${formatPrice(quote.discountCents, currency)}`} /> : null}
              <Row
                label="Shipping"
                value={quote ? (quote.shipping.amountCents === 0 ? "Free" : formatPrice(quote.shipping.amountCents, currency)) : "Calculated next step"}
              />
              {quote && quote.taxCents > 0 ? <Row label="Tax" value={formatPrice(quote.taxCents, currency)} /> : null}
              <div className="border-t border-ivory-300 pt-3 mt-3">
                <Row label={<strong>Total</strong>} value={<strong>{quote ? formatPrice(quote.totalCents, currency) : "Calculated next step"}</strong>} />
              </div>
            </div>
            {(quote?.hasPreorder ?? lines.some((l) => isPreorderLine(l, preorder))) ? (
              <p className="text-xs text-ink/60 mt-4">
                {preorder.label} items: {preorder.shipNote}, in the order received. You are charged today. If the shipping date changes, we email you the new date and you can cancel for a full refund.
              </p>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-ink/60 mt-4">
              <Lock className="size-3.5" /> Secure checkout via Stripe
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  const labels = ["Shipping", "Delivery", "Payment", "Confirmation"];
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
            {i < labels.length - 1 ? <span className="text-ink/30">·</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Appearance, StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
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

export function CheckoutFlow({ signedIn, publishableKey, reminderOffered }: { signedIn: boolean; publishableKey: string; reminderOffered: boolean }) {
  const params = useSearchParams();
  const { lines, clear } = useCart();
  const preorder = usePreorder();
  // Back from a bank redirect (for example 3-D Secure): the server confirms the session before showing the confirmation.
  const returnSession = params.get("step") === "confirmation" ? params.get("session_id") : null;
  const returnOrder = returnSession ? params.get("order") : null;
  const [returnState, setReturnState] = useState<"checking" | "paid" | "failed" | null>(returnSession ? "checking" : null);
  const [step, setStep] = useState<Step>(returnSession ? "confirmation" : "shipping");
  const [email, setEmail] = useState("");
  // Opt-in only: unticked until the shopper ticks it.
  const [reminder, setReminder] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [quote, setQuote] = useState<ClientQuote | null>(null);
  // The session's client secret as a promise: Stripe starts building the payment
  // form while the server is still creating the session (Stripe's documented pattern).
  const [secret, setSecret] = useState<Promise<string> | null>(null);
  const [orderId, setOrderId] = useState<string | null>(returnOrder);
  const [startError, setStartError] = useState<string | null>(null);

  // Load Stripe.js as soon as checkout opens, so it is ready by the payment step.
  useEffect(() => {
    if (publishableKey) void getStripe(publishableKey);
  }, [publishableKey]);

  const elementsOptions = useMemo<StripeCheckoutElementsSdkOptions | null>(() => (secret ? { clientSecret: secret, elementsOptions: { appearance: APPEARANCE } } : null), [secret]);

  useEffect(() => {
    if (!returnSession || !returnOrder) return;
    let cancelled = false;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(returnSession)}&order=${encodeURIComponent(returnOrder)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status?: string } | null) => {
        if (cancelled) return;
        if (d?.status === "complete") {
          setReturnState("paid");
          clear();
        } else {
          setReturnState("failed");
          setStep("shipping");
        }
      })
      .catch(() => !cancelled && (setReturnState("failed"), setStep("shipping")));
    return () => {
      cancelled = true;
    };
  }, [returnSession, returnOrder, clear]);

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

  function startPayment(rateId: string, discountCode: string | null) {
    if (!address) return;
    setStartError(null);
    const created = fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        address,
        items: requestedLines(lines),
        currency,
        shippingRateId: rateId,
        ...(discountCode ? { discountCode } : {}),
        ...(reminderOffered && reminder ? { cartReminder: true } : {}),
      }),
    }).then(async (res) => {
      const data = (await res.json().catch(() => ({}))) as { clientSecret?: string; orderId?: string; quote?: ClientQuote; error?: string };
      if (!res.ok || !data.clientSecret || !data.orderId || !data.quote) throw new Error(data.error ?? "We couldn't start payment. Please try again.");
      setOrderId(data.orderId);
      setQuote(data.quote);
      return data.clientSecret;
    });
    // If the server refuses (for example a code or stock changed), go back to delivery with its reason.
    created.catch((err: Error) => {
      setSecret(null);
      setStartError(err.message || "We couldn't start payment. Please try again.");
      setStep("method");
    });
    setSecret(created);
    setStep("payment");
  }

  return (
    <div className="container py-10">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-ink/70 hover:text-forest-700 mb-8">
        <ArrowLeft className="size-4" /> Continue shopping
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        <div className="min-w-0">
          <Stepper current={stepIndex} />
          <div className="mt-8 space-y-4">
            {step === "shipping" ? (
              <ShippingStep
                email={email}
                onEmail={setEmail}
                reminderOffered={reminderOffered}
                reminder={reminder}
                onReminder={setReminder}
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
                  busy={false}
                  onBack={() => setStep("shipping")}
                  onContinue={startPayment}
                />
                {startError ? <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">{startError}</p> : null}
              </>
            ) : null}
            {step === "payment" && elementsOptions && address ? (
              <CheckoutElementsProvider stripe={getStripe(publishableKey)} options={elementsOptions}>
                <PaymentStep
                  preorder={quote ? quote.lines.some((l) => l.preorder) : lines.some((l) => isPreorderLine(l, preorder))}
                  onBack={() => {
                    setSecret(null);
                    setStep("method");
                  }}
                  onPaid={() => {
                    clear();
                    setStep("confirmation");
                  }}
                />
              </CheckoutElementsProvider>
            ) : null}
            {returnState === "failed" ? (
              <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3" role="alert">
                Your payment didn&apos;t go through, so no order was placed. Please check your details and try again.
              </p>
            ) : null}
            {step === "confirmation" && returnState === "checking" ? <p className="card p-8 text-center text-ink/70">Checking your payment…</p> : null}
            {step === "confirmation" && returnState !== "checking" ? <ConfirmationStep email={email} orderId={orderId} signedIn={signedIn} /> : null}
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
            {/* On phones only the current step is named, so the bar fits without scrolling. */}
            <span className={cn("text-ink/75", active ? "text-forest-800 font-medium" : "sr-only sm:not-sr-only")}>{label}</span>
            {i < labels.length - 1 ? <span className="text-ink/30">·</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Stripe's payment fields, matched to checkout's own (globals.css .input): navy-300 edges are 3.8:1 on white. */
const APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#001840",
    colorText: "#001840",
    colorDanger: "#C0392B",
    fontFamily: "IBM Plex Sans, system-ui, sans-serif",
    fontSizeBase: "16px",
    borderRadius: "6px",
  },
  rules: {
    ".Input": { border: "1px solid #6C84AE", boxShadow: "none", padding: "12px 14px" },
    ".Input:hover": { borderColor: "#3A5A90" },
    ".Input:focus": { borderColor: "#001840", boxShadow: "0 0 0 3px rgba(0, 24, 64, 0.2)" },
    ".Input--invalid": { borderColor: "#C0392B", boxShadow: "none" },
    ".Label": { fontWeight: "500", color: "#001840" },
    ".Tab": { border: "1px solid #6C84AE", boxShadow: "none" },
    ".Tab:hover": { borderColor: "#3A5A90" },
    ".Tab--selected": { borderColor: "#001840", boxShadow: "0 0 0 1px #001840" },
    ".AccordionItem": { border: "1px solid #6C84AE", boxShadow: "none" },
    ".AccordionItem:hover": { borderColor: "#3A5A90" },
    ".AccordionItem--selected": { borderColor: "#001840" },
  },
};

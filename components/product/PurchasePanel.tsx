"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Minus, Plus, RefreshCw, ShoppingBag, Check } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartStore";

type Mode = "one-time" | "subscribe";

export function PurchasePanel({
  product,
  currency,
}: {
  product: Product;
  currency: Currency;
}) {
  const cycles = product.subscriptionCycles;
  const hasSubscription = cycles.length > 0;
  const bestCycle = hasSubscription
    ? cycles.reduce((a, b) => (b.discountPct > a.discountPct ? b : a))
    : undefined;

  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<Mode>(hasSubscription ? "subscribe" : "one-time");
  const [cycleDays, setCycleDays] = useState<number>(cycles[0]?.days ?? 30);
  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? product.variants[0],
    [product.variants, variantId],
  );
  const { add } = useCart();

  // Sentinel sits around the primary CTA. When it leaves the top of the
  // viewport the sticky bar takes over.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!variant) return null;

  const unit = variant.priceCents[currency];
  const sub = cycles.find((c) => c.days === cycleDays);
  const subDiscount = mode === "subscribe" ? (sub?.discountPct ?? 0) : 0;
  const effective = Math.round(unit * (1 - subDiscount / 100));
  const ctaLabel = mode === "subscribe" ? "Subscribe now" : "Add to cart";

  function onAdd() {
    add({
      sku: variant!.sku,
      variantId: variant!.id,
      name: product.name,
      variantLabel: [variant!.name, variant!.size].filter(Boolean).join(" · "),
      image: product.images[0]?.url ?? "",
      qty,
      unitPriceCents: unit,
      currency,
      subscription:
        mode === "subscribe" && sub
          ? { cycleDays: sub.days, discountPct: sub.discountPct }
          : undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-display text-forest-800 tabular-nums">
          {formatPrice(effective, currency)}
        </span>
        {subDiscount > 0 ? (
          <>
            <span className="text-sm text-ink/50 line-through tabular-nums">{formatPrice(unit, currency)}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
              Save {subDiscount}%
            </span>
          </>
        ) : null}
      </div>

      {/* Variant selector */}
      {product.variants.length > 1 ? (
        <div>
          <span className="label">Format</span>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const active = v.id === variantId;
              const available = v.inStock;
              return (
                <button
                  key={v.id}
                  onClick={() => available && setVariantId(v.id)}
                  disabled={!available}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border-2 px-3 py-2 text-sm text-left transition-colors",
                    active
                      ? "border-forest-700 bg-forest-50"
                      : "border-ivory-300 hover:border-forest-300",
                    !available && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-ink/60">{v.size}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Subscribe & Save tiers */}
      {hasSubscription ? (
        <fieldset>
          <legend className="label">Subscribe &amp; save</legend>
          <div className="space-y-2">
            {cycles.map((c) => {
              const checked = mode === "subscribe" && c.days === cycleDays;
              const tierPrice = Math.round(unit * (1 - c.discountPct / 100));
              const best = bestCycle && c.days === bestCycle.days && cycles.length > 1;
              return (
                <label
                  key={c.days}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                    checked
                      ? "border-forest-700 bg-forest-50"
                      : "border-ivory-300 hover:border-forest-300",
                  )}
                >
                  <input
                    type="radio"
                    name={`cycle-${product.sku}`}
                    value={c.days}
                    checked={checked}
                    onChange={() => {
                      setMode("subscribe");
                      setCycleDays(c.days);
                    }}
                    className="size-4 shrink-0 accent-forest-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-navy-800">Every {c.days} days</span>
                    <span className="block text-xs font-semibold text-gold-700">Save {c.discountPct}%</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block font-semibold text-navy-800">{formatPrice(tierPrice, currency)}</span>
                    <span className="block text-xs text-ink/50 line-through">{formatPrice(unit, currency)}</span>
                  </span>
                  {best ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-surface">
                      Best value
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/60">
            <RefreshCw className="size-3.5" aria-hidden />
            Modify, pause, or cancel any time from your account.
          </p>
        </fieldset>
      ) : null}

      {/* Qty + CTA */}
      <div ref={sentinelRef} className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Quantity"
            className="inline-flex items-center border border-ivory-300 rounded-md"
          >
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="p-2.5 hover:bg-ivory-200"
            >
              <Minus className="size-4" />
            </button>
            <span className="px-4 text-sm min-w-[32px] text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="p-2.5 hover:bg-ivory-200"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button onClick={onAdd} className="btn-primary flex-1">
            <ShoppingBag className="size-4" />
            {ctaLabel}
          </button>
        </div>

        {hasSubscription ? (
          <p className="text-center text-sm">
            {mode === "subscribe" ? (
              <button
                type="button"
                onClick={() => setMode("one-time")}
                className="font-semibold text-navy-800 underline underline-offset-4 decoration-gold-500 decoration-2 hover:text-gold-700"
              >
                One-time purchase · {formatPrice(unit, currency)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("subscribe")}
                className="font-semibold text-navy-800 underline underline-offset-4 decoration-gold-500 decoration-2 hover:text-gold-700"
              >
                Subscribe &amp; save instead
              </button>
            )}
          </p>
        ) : null}
      </div>

      {/* Reassurance */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink/75">
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Free returns 30 days</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Third-party tested</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Secure checkout</li>
        <li className="flex items-center gap-2"><RefreshCw className="size-4 text-forest-600" />Cancel anytime</li>
      </ul>

      {/* Sticky buy bar, shown once the CTA above has scrolled out of view */}
      <div
        aria-hidden={!showBar}
        className={cn(
          "fixed inset-x-0 top-16 z-30 border-b border-ivory-300 bg-surface/95 backdrop-blur transition-transform duration-300 ease-brand lg:top-20",
          showBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 invisible pointer-events-none",
        )}
      >
        <div className="container flex h-14 items-center gap-3 lg:h-16">
          {product.images[0] ? (
            <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-md bg-cloud-200 sm:block">
              <Image src={product.images[0].url} alt="" fill sizes="40px" className="object-contain p-1" />
            </span>
          ) : null}
          <p className="min-w-0 flex-1 truncate font-medium text-navy-800">
            {product.name}
            <span className="ml-2 text-sm text-ink/55">
              {mode === "subscribe" && sub ? `Every ${sub.days} days` : "One-time"}
            </span>
          </p>
          <span className="shrink-0 font-semibold text-navy-800 tabular-nums">
            {formatPrice(effective, currency)}
          </span>
          <button
            onClick={onAdd}
            tabIndex={showBar ? 0 : -1}
            className="btn-primary shrink-0 px-5 py-2.5 text-sm"
          >
            <ShoppingBag className="size-4" />
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

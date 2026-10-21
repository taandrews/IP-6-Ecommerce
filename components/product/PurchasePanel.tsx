"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, ShoppingBag, Check } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartStore";
import { Badge } from "@/components/ui/Badge";
import { preorderUnitCents } from "@/lib/preorder";
import { usePreorder } from "@/components/store/StoreSettings";

type Mode = "one-time" | "subscribe";

export function PurchasePanel({
  product,
  currency,
}: {
  product: Product;
  currency: Currency;
}) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<Mode>("one-time");
  const [cycleDays, setCycleDays] = useState<number>(product.subscriptionCycles[0]?.days ?? 30);
  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? product.variants[0],
    [product.variants, variantId],
  );
  const { add } = useCart();
  const PREORDER = usePreorder();

  if (!variant) return null;

  const unit = variant.priceCents[currency];
  const sub = product.subscriptionCycles.find((c) => c.days === cycleDays);
  const subDiscount = sub?.discountPct ?? 0;
  const effective = mode === "subscribe" ? Math.round(unit * (1 - subDiscount / 100)) : preorderUnitCents(unit, PREORDER);
  const showPreorder = PREORDER.active && mode === "one-time";

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
        mode === "subscribe"
          ? { cycleDays, discountPct: subDiscount }
          : undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-display text-forest-800">
          {formatPrice(effective, currency)}
        </span>
        {(mode === "subscribe" && subDiscount > 0) || showPreorder ? (
          <span className="text-sm text-ink/50 line-through">{formatPrice(unit, currency)}</span>
        ) : null}
        {showPreorder ? (
          <Badge variant="gold">{PREORDER.label} · {PREORDER.discountPct}% off</Badge>
        ) : null}
      </div>
      {PREORDER.active ? (
        <p className="text-sm text-ink/70 -mt-3">
          {PREORDER.label}: {PREORDER.discountPct}% off one-time purchases, applied in your cart. {PREORDER.shipNote}. Free US shipping on orders over $75.
        </p>
      ) : null}

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

      {/* Purchase mode toggle */}
      <fieldset>
        <legend className="label">Purchase option</legend>
        <div className={cn("grid gap-2", product.subscriptionCycles.length > 0 && "sm:grid-cols-2")}>
          <ModeCard
            active={mode === "one-time"}
            onClick={() => setMode("one-time")}
            title={PREORDER.active ? "Pre-order, one-time" : "One-time purchase"}
            subtitle={
              PREORDER.active
                ? `Save ${PREORDER.discountPct}% · ${formatPrice(preorderUnitCents(unit, PREORDER), currency)}`
                : formatPrice(unit, currency)
            }
            badge={PREORDER.active ? `-${PREORDER.discountPct}%` : undefined}
          />
          {product.subscriptionCycles.length > 0 ? (
            <ModeCard
              active={mode === "subscribe"}
              onClick={() => setMode("subscribe")}
              title="Subscribe & save"
              subtitle={
                subDiscount > 0
                  ? `Save ${subDiscount}% · ${formatPrice(Math.round(unit * (1 - subDiscount / 100)), currency)}`
                  : "Flexible delivery"
              }
              badge={subDiscount > 0 ? `-${subDiscount}%` : undefined}
            />
          ) : null}
        </div>
      </fieldset>

      {/* Subscription cycle */}
      {mode === "subscribe" ? (
        <div>
          <span className="label">Delivery frequency</span>
          <div className="flex gap-2 flex-wrap">
            {product.subscriptionCycles.map((c) => {
              const active = c.days === cycleDays;
              return (
                <button
                  key={c.days}
                  onClick={() => setCycleDays(c.days)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-sm",
                    active
                      ? "border-forest-700 bg-forest-700 text-ivory-100"
                      : "border-ivory-300 hover:border-forest-300",
                  )}
                >
                  Every {c.days} days · {c.discountPct}% off
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Qty + CTA */}
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
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
            className="p-2.5 hover:bg-ivory-200"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button onClick={onAdd} className="btn-primary flex-1" disabled={!variant.inStock}>
          <ShoppingBag className="size-4" />
          {!variant.inStock ? "Out of stock" : mode === "subscribe" ? "Subscribe now" : PREORDER.active ? "Pre-order now" : "Add to cart"}
        </button>
      </div>

      {/* Reassurance */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink/75">
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Made in USA</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Third-party tested</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-forest-600" />Secure checkout</li>
        {product.subscriptionCycles.length > 0 ? (
          <li className="flex items-center gap-2"><RefreshCw className="size-4 text-forest-600" />Cancel anytime</li>
        ) : null}
      </ul>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative text-left rounded-md border-2 p-4 transition-colors",
        active ? "border-forest-700 bg-forest-50" : "border-ivory-300 hover:border-forest-300",
      )}
    >
      {badge ? (
        <Badge variant="gold" className="absolute top-2 right-2">{badge}</Badge>
      ) : null}
      <div className="font-medium">{title}</div>
      <div className="text-sm text-ink/70 mt-0.5">{subtitle}</div>
    </button>
  );
}

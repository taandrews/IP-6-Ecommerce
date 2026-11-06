"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, RefreshCw, ShoppingBag, Check } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartStore";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "./AddToCartButton";
import { preorderUnitCents } from "@/lib/preorder";
import { usePreorder } from "@/components/store/StoreSettings";
import { useGeo } from "@/components/store/Geo";
import { WaitlistForm } from "@/components/store/WaitlistForm";
import { TRANSIT_DAYS } from "@/lib/shipping";
import styles from "./ProductDetail.module.css";

type Mode = "one-time" | "subscribe";

export function PurchasePanel({
  product,
  currency,
  variantId: controlledId,
  onVariantChange,
  presentation,
}: {
  product: Product;
  currency: Currency;
  /** When given, the parent owns the selected size (so the gallery can follow it). */
  variantId?: string;
  onVariantChange?: (id: string) => void;
  presentation?: "editorial" | "catalog";
}) {
  const [ownId, setOwnId] = useState(product.variants[0]?.id ?? "");
  const variantId = controlledId ?? ownId;
  const setVariantId = (id: string) => {
    setOwnId(id);
    onVariantChange?.(id);
  };
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<Mode>("one-time");
  const [cycleDays, setCycleDays] = useState<number>(product.subscriptionCycles[0]?.days ?? 30);
  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? product.variants[0],
    [product.variants, variantId],
  );
  const { add } = useCart();
  const PREORDER = usePreorder();
  const { sellable } = useGeo();
  const router = useRouter();

  if (!variant) return null;

  const unit = variant.priceCents[currency];
  const sub = product.subscriptionCycles.find((c) => c.days === cycleDays);
  const subDiscount = sub?.discountPct ?? 0;
  const subUnit = Math.round(unit * (1 - subDiscount / 100));
  const effective = mode === "subscribe" ? subUnit : preorderUnitCents(unit, PREORDER);
  const showPreorder = PREORDER.active && mode === "one-time";

  function cartLine() {
    return {
      sku: variant!.sku,
      variantId: variant!.id,
      name: product.name,
      variantLabel: [variant!.name, variant!.size].filter(Boolean).join(" · "),
      image: variant!.image?.url ?? product.images[0]?.url ?? "",
      qty,
      unitPriceCents: unit,
      currency,
      subscription:
        mode === "subscribe"
          ? { cycleDays, discountPct: subDiscount }
          : undefined,
    };
  }

  /** Pre Order Now: add the line and go straight to checkout. */
  function onOrderNow() {
    add(cartLine(), { openDrawer: false });
    router.push("/checkout");
  }

  if (presentation === "editorial" || presentation === "catalog") return (
    <div className={`${styles.purchase} ${presentation === "catalog" ? styles.catalogPurchase : ""}`}>
      <div className={styles.packRow}>
        <strong>{product.category === "pet" ? variant.size : `${variant.size?.replace(/\s*count/, "")} capsules`}</strong>
        {showPreorder && <span className={styles.offer}>{PREORDER.discountPct}% LAUNCH OFFER</span>}
      </div>
      <div className={styles.price} aria-live="polite">
        <strong>{formatPrice(effective, currency)}</strong>
        {effective < unit && <del>{formatPrice(unit, currency)}</del>}
      </div>
      <p className={styles.serving}>{variant.servingLabel}{product.category === "supplement" ? " per serving" : ""}</p>
      {product.variants.length > 1 && <label className={styles.selectLabel}>Size
        <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
          {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.inStock}>{v.size}</option>)}
        </select>
      </label>}
      {product.subscriptionCycles.length > 0 && <>
        <label className={styles.selectLabel}>Purchase option
          <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
            <option value="one-time">One-time purchase</option>
            <option value="subscribe">Subscribe &amp; save</option>
          </select>
        </label>
        {mode === "subscribe" && <div className={styles.subscription}>
          <label className={styles.selectLabel}>Delivery frequency
            <select value={cycleDays} onChange={(event) => setCycleDays(Number(event.target.value))}>
              {product.subscriptionCycles.map((cycle) => <option key={cycle.days} value={cycle.days}>Every {cycle.days} days · {cycle.discountPct}% off</option>)}
            </select>
          </label>
          <p>{formatPrice(subUnit * qty, currency)} per delivery, plus standard shipping, every {cycleDays} days until canceled. Skip, pause or cancel from your account.</p>
        </div>}
      </>}
      {!sellable ? <WaitlistForm source="product" product={variant.sku} className={styles.waitlist} /> : <div className={styles.actions}>
        <div className={styles.quantity} role="group" aria-label="Quantity">
          <button type="button" disabled={qty === 1} onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
          <output aria-live="polite">{qty}</output>
          <button type="button" disabled={qty === 20} onClick={() => setQty(q => Math.min(20, q + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
        </div>
        <AddToCartButton line={cartLine} disabled={!variant.inStock} className={styles.addButton} />
        <button type="button" className={styles.orderButton} onClick={onOrderNow} disabled={!variant.inStock}>{!variant.inStock ? "Out of stock" : "Pre Order Now"}</button>
      </div>}
      {PREORDER.active && <p className={styles.shipNote}>{PREORDER.shipNote}</p>}
    </div>
  );

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
{PREORDER.label} offer, for a limited time: {PREORDER.discountPct}% off one-time purchases while pre-orders are open, applied in your cart. {PREORDER.shipNote}. Free US shipping on orders over $75.
        </p>
      ) : null}

      {/* Size selector: each size shows its price, servings and price per serving so the two can be compared in place. */}
      {product.variants.length > 1 ? (
        <div>
          <span className="label">Size</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {product.variants.map((v) => {
              const active = v.id === variantId;
              const available = v.inStock;
              const vUnit = v.priceCents[currency];
              const vShown = mode === "subscribe" ? Math.round(vUnit * (1 - subDiscount / 100)) : preorderUnitCents(vUnit, PREORDER);
              return (
                <button
                  key={v.id}
                  onClick={() => available && setVariantId(v.id)}
                  disabled={!available}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border-2 px-4 py-3 text-left transition-colors",
                    active
                      ? "border-forest-700 bg-forest-50"
                      : "border-ivory-300 hover:border-forest-300",
                    !available && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-navy-800">{v.size}</span>
                    <span className="font-medium text-navy-800">{formatPrice(vShown, currency)}</span>
                  </div>
                  {v.servings ? (
                    <div className="mt-1 text-xs text-ink/65">
                      {v.servings} servings of {v.servingLabel} · {formatPrice(Math.round(vShown / v.servings), currency)} per serving
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : variant.servings ? (
        <p className="text-sm text-ink/65 -mt-2">
          {variant.size}: {variant.servings} servings of {variant.servingLabel} · {formatPrice(Math.round(effective / variant.servings), currency)} per serving
        </p>
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
                  ? `Save ${subDiscount}% · ${formatPrice(subUnit, currency)} every delivery`
                  : "Flexible delivery"
              }
              badge={subDiscount > 0 ? `-${subDiscount}%` : undefined}
            />
          ) : null}
        </div>
      </fieldset>

      {/* Subscription cycle, with what each delivery costs and how to stop. */}
      {mode === "subscribe" ? (
        <div className="space-y-3">
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
          <div className="rounded-md bg-cloud-200 border border-cloud-300 px-4 py-3 text-sm text-ink/80 leading-relaxed">
            <p>
              <strong className="text-navy-800">First delivery:</strong> {formatPrice(subUnit * qty, currency)} today.{" "}
              <strong className="text-navy-800">Then:</strong> {formatPrice(subUnit * qty, currency)} every {cycleDays} days, plus standard shipping, charged to the same card until you cancel. The {subDiscount}% discount applies to every delivery.
            </p>
            <p className="mt-1.5">
              We email a reminder before each renewal. Skip, pause or cancel any time from your account.
            </p>
          </div>
        </div>
      ) : null}

      {/* Qty + CTA, or the launch waitlist outside the countries we sell to */}
      {!sellable ? <WaitlistForm source="product" product={variant.sku} /> : <div className="flex items-center gap-3">
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
        <AddToCartButton line={cartLine} disabled={!variant.inStock} className="btn-secondary flex-1" />
        <button onClick={onOrderNow} className="btn-primary flex-1" disabled={!variant.inStock}>
          <ShoppingBag className="size-4" />
          {!variant.inStock ? "Out of stock" : "Pre Order Now"}
        </button>
      </div>}

      {/* Delivery */}
      <p className="text-sm text-ink/70 leading-relaxed">
        {PREORDER.active ? `${PREORDER.shipNote}, in the order received. ` : ""}Ships to US addresses only. You get a tracking email the day your order ships. After that, standard delivery usually takes {TRANSIT_DAYS.domesticStandard[0]} to {TRANSIT_DAYS.domesticStandard[1]} business days ({TRANSIT_DAYS.domesticExpedited[0]} to {TRANSIT_DAYS.domesticExpedited[1]} expedited); carrier delays can stretch that.{PREORDER.active ? " If the shipping date changes, we email you the new date and you can cancel for a full refund." : ""}
      </p>

      {/* Directions, right beside the purchase controls */}
      {product.howToUse[0] ? (
        <div className="rounded-md border border-cloud-300 px-4 py-3 text-sm text-ink/80 leading-relaxed">
          <p>
            <strong className="text-navy-800">How to take:</strong> {product.howToUse[0]}
          </p>
          <a href={product.category === "supplement" ? "/how-to-take" : "#how-to-use"} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
            Full directions
          </a>
        </div>
      ) : null}

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

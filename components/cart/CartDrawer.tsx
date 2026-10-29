"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, Trash2, ArrowRight, RefreshCw } from "lucide-react";
import { useCart } from "./CartStore";
import { Drawer } from "@/components/ui/Drawer";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { isPreorderLine, lineTotalCents } from "@/lib/preorder";
import { usePreorder } from "@/components/store/StoreSettings";
import { useGeo } from "@/components/store/Geo";
import { countryName } from "@/lib/countries";
import { FREE_SHIPPING_THRESHOLD_CENTS, qualifiesForFreeShipping } from "@/lib/shipping";

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, remove, setQty } = useCart();
  const PREORDER = usePreorder();
  const geo = useGeo();
  const subtotalCents = lines.reduce((s, l) => s + lineTotalCents(l, PREORDER), 0);
  const listCents = lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);
  const savingsCents = listCents - subtotalCents;
  // Load the saved cart only after hydration (see skipHydration in CartStore).
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  const currency = lines[0]?.currency ?? "USD";
  const hasSubscription = lines.some((l) => l.subscription);
  const hasPreorder = lines.some((l) => isPreorderLine(l, PREORDER));
  const freeShipping = qualifiesForFreeShipping(subtotalCents, currency);
  const toFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return (
    <Drawer open={drawerOpen} onClose={closeDrawer} title="Your cart">
      {lines.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p
            className="font-display italic text-forest-700 text-balance leading-tight"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontVariationSettings: '"opsz" 96, "SOFT" 80' }}
          >
            Nothing here yet.
          </p>
          <span className="inline-block hairline-gold-left bg-gold-400 my-5" />
          <p className="text-ink/70 mb-8 max-w-[28ch] mx-auto leading-relaxed">
            One supplement, formulated by the scientist who pioneered the research.
          </p>
          <Link href="/shop" onClick={closeDrawer} className="btn-primary">
            Browse the collection
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ivory-300">
            {lines.map((line) => (
              <li key={line.variantId + (line.subscription ? "-sub" : "")} className="p-6 flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-ivory-200">
                  <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-forest-800 truncate">{line.name}</p>
                      <p className="text-xs text-ink/60">{line.variantLabel}</p>
                      {line.subscription ? (
                        <Badge variant="gold" className="mt-1.5">
                          <RefreshCw className="size-3" /> Every {line.subscription.cycleDays} days · Save {line.subscription.discountPct}%
                        </Badge>
                      ) : isPreorderLine(line, PREORDER) ? (
                        <Badge variant="gold" className="mt-1.5">
                          {PREORDER.label} · {PREORDER.discountPct}% off
                        </Badge>
                      ) : null}
                    </div>
                    <button
                      onClick={() => remove(line.variantId)}
                      aria-label="Remove"
                      className="p-1.5 hover:bg-ivory-200 rounded"
                    >
                      <Trash2 className="size-4 text-ink/60" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div
                      role="group"
                      aria-label="Quantity"
                      className="inline-flex items-center border border-ivory-300 rounded-md"
                    >
                      <button
                        onClick={() => setQty(line.variantId, line.qty - 1)}
                        aria-label="Decrease"
                        className="p-1.5 hover:bg-ivory-200"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="px-3 text-sm min-w-[24px] text-center">{line.qty}</span>
                      <button
                        onClick={() => setQty(line.variantId, line.qty + 1)}
                        aria-label="Increase"
                        className="p-1.5 hover:bg-ivory-200"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-medium text-sm">
                      {isPreorderLine(line, PREORDER) ? (
                        <s className="mr-2 font-normal text-ink/50">
                          {formatPrice(line.unitPriceCents * line.qty, line.currency)}
                        </s>
                      ) : null}
                      {formatPrice(lineTotalCents(line, PREORDER), line.currency)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-ivory-300 p-6 space-y-3">
            {hasPreorder ? (
              <div className="rounded-md bg-gold-50 border border-gold-200 px-3 py-2.5 text-xs text-forest-900">
                {PREORDER.label}: {PREORDER.discountPct}% off is applied to one-time items. {PREORDER.shipNote}, in the order received, with a tracking email the day it ships. If the date changes we email you the new date and you can cancel for a full refund.
              </div>
            ) : null}
            {hasSubscription ? (
              <div className="rounded-md bg-gold-50 border border-gold-200 px-3 py-2.5 text-xs text-forest-900">
                Subscription items will renew on your chosen cycle. Manage anytime in your account.
              </div>
            ) : null}
            {savingsCents > 0 ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/70">Items</span>
                  <span className="text-ink/70">{formatPrice(listCents, currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gold-700">
                  <span>{hasPreorder && !hasSubscription ? `${PREORDER.label} discount (${PREORDER.discountPct}% off)` : "Discounts"}</span>
                  <span className="font-medium">&minus;{formatPrice(savingsCents, currency)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-ink/70">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotalCents, currency)}</span>
            </div>
            <div className="text-xs text-ink/60 space-y-1">
              {currency === "USD" ? (
                <p className={freeShipping ? "text-forest-700 font-medium" : undefined}>
                  {freeShipping ? "Free US shipping on this order." : `Add ${formatPrice(toFreeShipping, currency)} more for free US shipping.`}
                </p>
              ) : null}
              <p>Shipping & tax calculated at checkout</p>
            </div>
            {!geo.sellable ? (
              <p className="rounded-md border border-gold-300 px-3 py-2.5 text-xs text-navy-800">
                We don&apos;t ship to {countryName(geo.country)} yet. Orders need a shipping address in the 50 US states or Washington, DC.
              </p>
            ) : null}
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="btn-primary w-full justify-center mt-2"
            >
              Checkout <ArrowRight className="size-4" />
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import type { Product, Currency } from "@/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { formatPrice } from "@/lib/utils";
import { preorderUnitCents } from "@/lib/preorder";
import { usePreorder } from "@/components/store/StoreSettings";

/**
 * Owns the selected size so the gallery, the price shown at the top of the
 * page on phones, and the purchase panel all describe the same bottle.
 *
 * Phones read top to bottom: name and price, then the photo, then the purchase
 * controls, with a link that jumps straight to them. Desktop keeps the photo on
 * the left and the heading plus purchase panel on the right.
 */
export function ProductShowcase({
  product,
  currency,
  heading,
}: {
  product: Product;
  currency: Currency;
  heading: ReactNode;
}) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const PREORDER = usePreorder();

  // The selected size's photo leads; the other images follow in catalog order.
  const images = useMemo(() => {
    const own = variant?.image;
    if (!own) return product.images;
    return [own, ...product.images.filter((im) => im.url !== own.url)];
  }, [product.images, variant]);

  if (!variant) return null;
  const unit = variant.priceCents[currency];
  const effective = preorderUnitCents(unit, PREORDER);

  return (
    <div className="container py-6 lg:py-14 grid gap-6 lg:gap-x-16 lg:gap-y-0 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[auto_1fr] stagger">
      {/* Phones: name and price first, with a jump to the purchase controls. */}
      <div className="order-1 lg:hidden">
        <p className="eyebrow mb-3">{product.category === "pet" ? "For pets" : "Supplement"}</p>
        <h1 className="font-serif text-navy-800 text-balance" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "2rem", lineHeight: 1.05, letterSpacing: "-0.025em", fontWeight: 400 }}>
          {product.name}
        </h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-display text-forest-800">{formatPrice(effective, currency)}</span>
          {effective !== unit ? <span className="text-sm text-ink/50 line-through">{formatPrice(unit, currency)}</span> : null}
          <span className="text-sm text-ink/60">{variant.size}</span>
        </div>
        <a href="#purchase" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 underline underline-offset-4 decoration-gold-500 decoration-2">
          Choose a size and order
          <ArrowDown className="size-3.5" aria-hidden />
        </a>
      </div>

      <div className="order-2 lg:order-none lg:row-span-2">
        <ProductGallery key={variant.id} images={images} />
      </div>

      <div className="order-3 lg:order-none hidden lg:block">{heading}</div>

      <div id="purchase" className="order-4 lg:order-none scroll-mt-24">
        <PurchasePanel product={product} currency={currency} variantId={variant.id} onVariantChange={setVariantId} />
      </div>
    </div>
  );
}

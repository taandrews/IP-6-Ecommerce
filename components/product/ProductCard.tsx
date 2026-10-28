import { productHref } from "@/lib/product-links";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product, Currency } from "@/types";
import type { PreorderSettings } from "@/types/records";
import { formatPrice } from "@/lib/utils";
import { DEFAULT_PREORDER, preorderUnitCents } from "@/lib/preorder";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product, currency, preorder = DEFAULT_PREORDER }: { product: Product; currency: Currency; preorder?: PreorderSettings }) {
  const image = product.images[0];
  const categoryLabel = {
    supplement: "Supplement",
    pet: "For pets",
    skincare: "Skincare",
    filter: "Water filter",
  }[product.category];

  // First 3 highlights as benefit bullets.
  const bullets = product.highlights.slice(0, 3);
  const first = product.variants.find((v) => v.inStock) ?? product.variants[0];

  return (
    <article className="group rounded-lg overflow-hidden border border-ivory-300 bg-surface hover:shadow-card transition-shadow duration-300 flex flex-col">
      <Link href={productHref(product.slug)} className="block relative aspect-[4/3] overflow-hidden bg-ivory-200">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 420px, 50vw"
            className={`transition-transform duration-500 ease-brand group-hover:scale-[1.04] ${
              image.width / image.height < 1
                ? "object-contain p-4"
                : "object-cover"
            }`}
          />
        ) : null}
        <div className="absolute top-3 left-3 bg-surface/95 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] font-medium text-forest-800">
          {categoryLabel}
        </div>
        {product.comingSoon ? (
          <div className="absolute top-3 right-3 bg-navy-800 text-surface rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-semibold">
            Coming Soon
          </div>
        ) : null}
      </Link>

      <div className="p-6 flex-1 flex flex-col">
        <Link href={productHref(product.slug)}>
          <h3
            className="font-display text-2xl text-forest-800 leading-tight hover:text-forest-700 transition-colors"
            style={{ fontVariationSettings: '"opsz" 72, "SOFT" 40' }}
          >
            {product.name}
          </h3>
        </Link>

        <p
          className="mt-2 text-sm font-medium"
          style={{ color: "rgb(176 142 53)" }}
        >
          {product.heroClaim}
        </p>

        <ul className="mt-4 space-y-1.5 text-sm text-ink/80 flex-1">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-2 size-1 rounded-full bg-gold-400 shrink-0" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-end justify-between gap-4 pt-5 border-t border-ivory-300">
          {product.comingSoon ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink/55 mb-0.5">Status</p>
                <p
                  className="font-display text-xl text-forest-800"
                  style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}
                >
                  Coming Soon
                </p>
              </div>
              <Link
                href={productHref(product.slug)}
                className="btn-secondary text-sm px-4 py-2.5 group/btn"
              >
                Notify me
                <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <>
              <ul className="text-sm space-y-1">
                {product.variants.map((v) => {
                  const regular = v.priceCents[currency];
                  const now = preorderUnitCents(regular, preorder);
                  return (
                    <li key={v.id} className="flex items-baseline gap-2">
                      <span className="text-ink/70 min-w-[7ch]">{v.size}</span>
                      {now !== regular ? <s className="text-ink/45">{formatPrice(regular, currency)}</s> : null}
                      <span className="font-semibold text-forest-800">{formatPrice(now, currency)}</span>
                    </li>
                  );
                })}
                {preorder.active ? <li className="text-[11px] text-ink/55">{preorder.label}, {preorder.discountPct}% off</li> : null}
              </ul>
              <div className="flex flex-col items-end gap-2">
                {first ? (
                  <AddToCartButton
                    disabled={!first.inStock}
                    className="btn-secondary text-sm px-4 py-2.5 whitespace-nowrap"
                    line={() => ({
                      sku: first.sku,
                      variantId: first.id,
                      name: product.name,
                      variantLabel: [first.name, first.size].filter(Boolean).join(" · "),
                      image: first.image?.url ?? image?.url ?? "",
                      qty: 1,
                      unitPriceCents: first.priceCents[currency],
                      currency,
                    })}
                  />
                ) : null}
                <Link
                  href={productHref(product.slug)}
                  className="btn-primary text-sm px-4 py-2.5 group/btn"
                >
                  Shop
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

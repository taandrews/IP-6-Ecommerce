import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, currency }: { product: Product; currency: Currency }) {
  const image = product.images[0];
  const prices = product.variants.map((v) => v.priceCents[currency]);
  const startingFrom = Math.min(...prices);
  const categoryLabel = {
    supplement: "Supplement",
    skincare: "Skincare",
    filter: "Water filtration",
  }[product.category];

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative block rounded-lg overflow-hidden bg-ivory-200 border border-ivory-300/60 hover:border-forest-300 transition-colors duration-500 ease-brand"
    >
      {/* Image area fills the card; copy overlays from the bottom on hover */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 420px, 50vw"
            className="object-cover transition-transform duration-[900ms] ease-brand group-hover:scale-[1.06]"
          />
        ) : null}

        {/* Darkening veil for contrast on hover */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-forest-900/70 via-forest-900/10 to-transparent opacity-50 group-hover:opacity-95 transition-opacity duration-500"
        />

        {/* Top corner: serial number */}
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between text-ivory-100">
          <p className="text-[10px] uppercase tracking-[0.32em] opacity-75">
            <span className="opacity-60">№&nbsp;</span>
            {product.sku}
          </p>
          <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500">
            <ArrowUpRight className="size-5" />
          </div>
        </div>

        {/* Bottom copy — shifts up and gains detail on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-ivory-100">
          <p className="text-[11px] uppercase tracking-[0.28em] opacity-80 mb-2">
            {categoryLabel}
          </p>
          <h3
            className="font-display text-balance leading-[1.05]"
            style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)", fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
          >
            {product.name}
          </h3>

          <div className="h-px bg-gold-400/70 w-12 my-4 origin-left group-hover:w-24 transition-all duration-500 ease-brand" />

          <p className="text-sm leading-relaxed opacity-0 group-hover:opacity-90 max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-brand">
            {product.shortDescription}
          </p>

          <div className="mt-5 flex items-end justify-between">
            <p>
              <span className="text-[10px] uppercase tracking-[0.28em] opacity-70 block">From</span>
              <span
                className="font-display"
                style={{ fontSize: "1.3rem", fontVariationSettings: '"opsz" 72, "SOFT" 50' }}
              >
                {formatPrice(startingFrom, currency)}
              </span>
            </p>
            <p
              className="font-display italic text-gold-300"
              style={{ fontSize: "0.85rem", fontVariationSettings: '"opsz" 24, "SOFT" 90' }}
            >
              {product.heroClaim}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

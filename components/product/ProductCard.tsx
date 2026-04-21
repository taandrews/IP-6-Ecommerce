import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, currency }: { product: Product; currency: Currency }) {
  const image = product.images[0];
  const prices = product.variants.map((v) => v.priceCents[currency]);
  const startingFrom = Math.min(...prices);
  const categoryLabel = {
    supplement: "Supplement",
    skincare: "Skincare",
    filter: "Water filter",
  }[product.category];

  // First 3 highlights as benefit bullets.
  const bullets = product.highlights.slice(0, 3);

  return (
    <article className="group rounded-lg overflow-hidden border border-ivory-300 bg-surface hover:shadow-card transition-shadow duration-300 flex flex-col">
      <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-ivory-200">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 420px, 50vw"
            className="object-cover transition-transform duration-500 ease-brand group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute top-3 left-3 bg-surface/95 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] font-medium text-forest-800">
          {categoryLabel}
        </div>
      </Link>

      <div className="p-6 flex-1 flex flex-col">
        <Link href={`/shop/${product.slug}`}>
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
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink/55 mb-0.5">From</p>
            <p
              className="font-display text-xl text-forest-800"
              style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}
            >
              {formatPrice(startingFrom, currency)}
            </p>
          </div>
          <Link
            href={`/shop/${product.slug}`}
            className="btn-primary text-sm px-4 py-2.5 group/btn"
          >
            Shop
            <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

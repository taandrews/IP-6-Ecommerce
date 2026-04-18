import Image from "next/image";
import Link from "next/link";
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
      className="group relative block rounded-lg overflow-hidden border border-ivory-300/70 bg-surface hover:shadow-card transition-all duration-500 ease-brand"
    >
      {/* Image with rotated vertical claim badge on the right edge */}
      <div className="relative aspect-[4/5] bg-ivory-200 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 360px, 50vw"
            className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.04]"
          />
        ) : null}

        {/* Soft gradient wash on hover to add depth */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(27,67,50,0.25), transparent 55%)",
          }}
        />

        {/* Vertical hero claim — runs along right edge of image */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div
            className="origin-top-right"
            style={{ writingMode: "vertical-rl" }}
          >
            <span className="inline-block bg-gold-400/95 text-forest-900 text-[10px] uppercase tracking-[0.28em] font-medium px-2.5 py-1.5 rounded-sm">
              {product.heroClaim}
            </span>
          </div>
        </div>

        {/* Category tag — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-block bg-ivory-100/95 text-forest-800 text-[10px] uppercase tracking-[0.24em] font-medium px-2 py-1 rounded-sm backdrop-blur-sm">
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl text-forest-800 group-hover:text-forest-700 transition-colors">
          {product.name}
        </h3>
        <span className="hairline-gold mt-3 mb-4" />
        <p className="text-sm text-ink/70 line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>
        <div className="mt-5 flex items-end justify-between">
          <p className="text-forest-800">
            <span className="text-[10px] uppercase tracking-[0.24em] text-ink/55 block mb-1">
              From
            </span>
            <span className="font-display text-xl">
              {formatPrice(startingFrom, currency)}
            </span>
          </p>
          <p className="sku-serial">{product.sku}</p>
        </div>
      </div>
    </Link>
  );
}

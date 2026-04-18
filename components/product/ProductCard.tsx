import Image from "next/image";
import Link from "next/link";
import type { Product, Currency } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

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
      className="group block card overflow-hidden hover:shadow-card transition-shadow duration-300"
    >
      <div className="relative aspect-[4/5] bg-ivory-200 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 360px, 50vw"
            className="object-cover transition-transform duration-500 ease-brand group-hover:scale-105"
          />
        ) : null}
        <Badge variant="gold" className="absolute top-3 left-3">{product.heroClaim}</Badge>
      </div>
      <div className="p-5">
        <p className="eyebrow mb-1">{categoryLabel}</p>
        <h3 className="font-display text-lg text-forest-800 group-hover:text-forest-700">
          {product.name}
        </h3>
        <p className="text-sm text-ink/70 mt-1 line-clamp-2">{product.shortDescription}</p>
        <p className="mt-3 font-medium text-forest-800">
          From {formatPrice(startingFrom, currency)}
        </p>
      </div>
    </Link>
  );
}

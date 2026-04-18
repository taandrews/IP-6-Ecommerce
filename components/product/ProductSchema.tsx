import type { Product, Currency } from "@/types";

export function ProductSchema({
  product,
  currency,
  reviewAggregate,
}: {
  product: Product;
  currency: Currency;
  reviewAggregate?: { avg: number; count: number };
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com";
  const url = `${base}/shop/${product.slug}`;
  const minPrice =
    Math.min(...product.variants.map((v) => v.priceCents[currency])) / 100;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => i.url),
    sku: product.sku,
    brand: { "@type": "Brand", name: "IP-6 Research, Inc." },
    category: product.category,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: minPrice.toFixed(2),
      offerCount: product.variants.length,
      availability: "https://schema.org/InStock",
      url,
    },
    ...(reviewAggregate && reviewAggregate.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewAggregate.avg.toFixed(1),
            reviewCount: reviewAggregate.count,
          },
        }
      : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${base}/shop` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

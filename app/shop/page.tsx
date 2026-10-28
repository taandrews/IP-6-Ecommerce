import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopCatalog } from "@/components/store/ShopCatalog";
import { ShopHero } from "@/components/store/ShopHero";
import { TrustTicker } from "@/components/home/TrustTicker";
import { Footer } from "@/components/layout/Footer";
import { ProductSchema } from "@/components/product/ProductSchema";
import { getPublishedReviews } from "@/lib/data/reviews";
import type { Review } from "@/types";
import { getCatalog } from "@/lib/data/catalog";
import { getPreorderSettings } from "@/lib/data/settings";
import { resolveCurrency } from "@/lib/currency";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop IP6 Original, the IP6 and Inositol supplement of the highest purity, and IP6 Original Pet Powder for dogs and cats. Third-party tested, cGMP certified, made in USA.",
  alternates: hreflangAlternates("/shop"),
};

export default async function ShopPage() {
  const currency = resolveCurrency();
  const [products, preorder] = await Promise.all([getCatalog(), getPreorderSettings()]);
  const reviewsBySku: Record<string, Review[]> = Object.fromEntries(await Promise.all(products.map(async (product) => [product.sku, (await getPublishedReviews(product.sku)).map(review => ({ ...review, rating: review.rating as Review["rating"] }))])));
  return (
    <>
      <h1 className="sr-only">Shop IP6 Original</h1>
      <ShopHero />
      <TrustTicker />
      <Suspense fallback={null}>
        <ShopCatalog products={products} currency={currency} preorder={preorder} reviewsBySku={reviewsBySku} />
      </Suspense>

      {products.map(product => {
        const reviews = reviewsBySku[product.sku] ?? [];
        const reviewAggregate = reviews.length ? { avg: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, count: reviews.length } : undefined;
        return <ProductSchema key={product.sku} product={product} currency={currency} reviewAggregate={reviewAggregate} />;
      })}
      <Footer showDshea />
    </>
  );
}

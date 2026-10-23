import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
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
  return (
    <>
      <section className="container py-16 lg:py-24 text-center max-w-2xl mx-auto">
        <p className="eyebrow mb-3">The collection</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          IP6 Original, for people and pets.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed">
          The highest purity, research grade, third-party tested, and manufactured to cGMP standards.
        </p>
      </section>

      <section className="container pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.sku} product={p} currency={currency} preorder={preorder} />
          ))}
        </div>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

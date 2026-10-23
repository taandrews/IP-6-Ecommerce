import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopCatalog } from "@/components/store/ShopCatalog";
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
      <section className="container pt-16 pb-10 lg:pt-20 lg:pb-12 text-center max-w-2xl mx-auto">
        <p className="eyebrow mb-3">The collection</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          IP6 Original, for people and pets.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed">
          The highest purity, research grade, third-party tested, and manufactured to cGMP standards.
        </p>
      </section>

      <Suspense fallback={null}>
        <ShopCatalog products={products} currency={currency} preorder={preorder} />
      </Suspense>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

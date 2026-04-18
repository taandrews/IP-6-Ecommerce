import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop IP-6 Research supplements, cortisone-free skincare, and the IP6-Citrate water filter. Third-party tested. Held to institutional standards.",
  alternates: hreflangAlternates("/shop"),
};

export default function ShopPage() {
  const currency = resolveCurrency();
  return (
    <>
      <section className="container py-16 lg:py-24 text-center max-w-2xl mx-auto">
        <p className="eyebrow mb-3">The collection</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          Three products. Considered in full.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed">
          Each product is developed to a research-grade specification, third-party tested, and manufactured to cGMP standards.
        </p>
      </section>

      <section className="container pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.sku} product={p} currency={currency} />
          ))}
        </div>
      </section>

      <Footer showDshea />
    </>
  );
}

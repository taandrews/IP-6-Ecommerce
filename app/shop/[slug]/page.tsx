import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Leaf, ShieldCheck, Award, Zap } from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { Reviews } from "@/components/product/Reviews";
import { ProductSchema } from "@/components/product/ProductSchema";
import { DsheaDisclaimer } from "@/components/product/Dshea";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Stars } from "@/components/ui/Stars";
import { products, getProductBySlug, getProductsBySkus } from "@/content/products";
import { testimonials } from "@/content/testimonials";
import { resolveCurrency } from "@/lib/currency";
import { hreflangAlternates } from "@/lib/i18n";
import { SupplementSections } from "./_sections/SupplementSections";
import { SkincareSections } from "./_sections/SkincareSections";
import { FilterSections } from "./_sections/FilterSections";

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: hreflangAlternates(`/shop/${product.slug}`),
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((i) => i.url),
    },
  };
}

export default function ProductPage({ params }: Params) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const currency = resolveCurrency();
  const related = getProductsBySkus(product.relatedSkus);
  const productTestimonials = testimonials.filter((t) => t.productSku === product.sku);
  const reviewAggregate =
    productTestimonials.length > 0
      ? {
          avg: productTestimonials.reduce((s, t) => s + t.rating, 0) / productTestimonials.length,
          count: productTestimonials.length,
        }
      : undefined;

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container pt-6 text-sm text-ink/60">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-forest-700">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-forest-700">Shop</Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink/80 truncate">{product.name}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="container py-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <ProductGallery images={product.images} />

        <div className="flex flex-col">
          <div className="mb-5">
            <Badge variant="gold" className="mb-3">{product.heroClaim}</Badge>
            <h1 className="font-display text-display-lg text-forest-800 mb-4 text-balance">
              {product.name}
            </h1>
            <p className="text-lg text-ink/75 leading-relaxed">{product.shortDescription}</p>
            {reviewAggregate ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-ink/70">
                <Stars rating={reviewAggregate.avg} size={16} />
                <span>
                  {reviewAggregate.avg.toFixed(1)} · {reviewAggregate.count} review
                  {reviewAggregate.count === 1 ? "" : "s"}
                </span>
              </div>
            ) : null}
          </div>

          <PurchasePanel product={product} currency={currency} />
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-ivory-200 py-16">
        <div className="container max-w-5xl">
          <h2 className="font-display text-display-md text-forest-800 mb-8">Product highlights</h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-ink/85">
                <Check className="size-5 text-forest-600 mt-0.5 shrink-0" aria-hidden />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Category-specific content */}
      {product.category === "supplement" ? <SupplementSections /> : null}
      {product.category === "skincare" ? <SkincareSections product={product} /> : null}
      {product.category === "filter" ? <FilterSections product={product} /> : null}

      {/* Ingredients / spec list */}
      {product.ingredients ? (
        <section className="container py-16 max-w-4xl">
          <h2 className="font-display text-display-md text-forest-800 mb-6">Ingredients</h2>
          <ul className="space-y-2 text-ink/85">
            {product.ingredients.map((i) => (
              <li key={i} className="border-b border-ivory-300 py-3">{i}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {product.specifications ? (
        <section className="container py-16 max-w-4xl">
          <h2 className="font-display text-display-md text-forest-800 mb-6">Technical specifications</h2>
          <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
            {product.specifications.map((s) => (
              <div key={s.label} className="border-b border-ivory-300 pb-3">
                <dt className="text-xs uppercase tracking-[0.18em] text-ink/60 mb-1">{s.label}</dt>
                <dd className="text-ink/90">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* How to use */}
      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-display-md text-forest-800 mb-6">How to use</h2>
        <ol className="space-y-4">
          {product.howToUse.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 size-8 rounded-full bg-forest-700 text-ivory-100 grid place-items-center font-display text-sm">
                {i + 1}
              </span>
              <p className="text-ink/85 pt-1 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Reassurance strip */}
      <section className="bg-forest-800 text-ivory-100 py-14">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Leaf, title: "Third-party tested", body: "Every batch." },
            { icon: ShieldCheck, title: "cGMP manufactured", body: "Pharmaceutical-grade standards." },
            { icon: Award, title: "Institutional spec", body: "Research-grade purity." },
            { icon: Zap, title: "Fast shipping", body: "Tracked worldwide." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon className="size-6 text-gold-300 shrink-0" aria-hidden />
              <div>
                <div className="font-display text-lg">{f.title}</div>
                <div className="text-sm text-ivory-100/80">{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-display-md text-forest-800 mb-8">Frequently asked</h2>
        <Accordion
          items={product.faq.map((f, i) => ({
            id: `pf-${i}`,
            header: f.q,
            content: <p>{f.a}</p>,
          }))}
        />
      </section>

      {/* Reviews */}
      <div className="container max-w-4xl">
        <Reviews
          sku={product.sku}
          initial={productTestimonials.map((t) => ({
            reviewId: t.id,
            sku: product.sku,
            authorName: t.authorName,
            rating: t.rating,
            title: `${t.rating}-star review`,
            body: t.body,
            verifiedPurchase: !!t.verified,
            createdAt: t.submittedAt,
          }))}
        />
      </div>

      {/* Related products */}
      {related.length > 0 ? (
        <section className="container py-16">
          <h2 className="font-display text-display-md text-forest-800 mb-8">You may also like</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard key={p.sku} product={p} currency={currency} />
            ))}
          </div>
        </section>
      ) : null}

      {/* DSHEA */}
      {product.requiresDsheaDisclaimer ? (
        <div className="container max-w-3xl mb-16">
          <DsheaDisclaimer />
        </div>
      ) : null}

      <ProductSchema product={product} currency={currency} reviewAggregate={reviewAggregate} />
      <Footer showDshea={product.requiresDsheaDisclaimer} />
    </>
  );
}

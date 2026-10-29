import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check, Leaf, ShieldCheck, Award, Zap } from "lucide-react";
import { ProductShowcase } from "@/components/product/ProductShowcase";
import { productHref } from "@/lib/product-links";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Reviews } from "@/components/product/Reviews";
import { ProductSchema } from "@/components/product/ProductSchema";
import { DsheaDisclaimer } from "@/components/product/Dshea";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { Grain } from "@/components/ui/Grain";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Stars } from "@/components/ui/Stars";
import { FileText } from "lucide-react";
import { products } from "@/content/products";
import { getCatalog } from "@/lib/data/catalog";
import { getPublishedReviews } from "@/lib/data/reviews";
import { resolveCurrency } from "@/lib/currency";
import { hreflangAlternates } from "@/lib/i18n";
import { SupplementSections } from "./_sections/SupplementSections";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: hreflangAlternates(productHref(product.slug).split("#")[0] ?? "/shop"),
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((i) => i.url),
    },
  };
}

export default async function ProductPage(props: Params) {
  const params = await props.params;
  const destination = productHref(params.slug);
  if (destination.startsWith("/shop#")) permanentRedirect(destination);
  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const currency = resolveCurrency();
  const related = catalog.filter((p) => product.relatedSkus.includes(p.sku));
  const published = await getPublishedReviews(product.sku);
  const reviewAggregate =
    published.length > 0
      ? { avg: published.reduce((s, r) => s + r.rating, 0) / published.length, count: published.length }
      : undefined;

  const heading = (
    <div className="mb-5">
      <p className="eyebrow mb-4">{product.category === "supplement" ? "Supplement" : product.category === "pet" ? "For pets" : product.category === "skincare" ? "Skincare" : "Water filtration"}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="gold">{product.heroClaim}</Badge>
        {product.comingSoon ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-800 text-surface px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.18em]">
            Coming Soon
          </span>
        ) : null}
      </div>
      <h1
        className="font-serif text-balance text-navy-800 mb-4"
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "clamp(2rem, 4vw, 3.25rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          fontWeight: 400,
        }}
      >
        {product.name}
      </h1>
      {product.category === "supplement" ? (
        <p
          className="font-serif text-gold-700 mb-4"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          The highest purity. Research grade.
        </p>
      ) : null}
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
  );

  return (
    <>
      {/* Product hero */}
      <section className="bg-atmosphere relative">
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

        {product.comingSoon ? (
          <div className="container py-10 lg:py-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <ProductGallery images={product.images} />
            <div className="flex flex-col">
              {heading}
              <div className="rounded-lg border border-cloud-300 bg-cloud-100 p-8">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-3">
                  Status
                </p>
                <p className="font-sans font-bold text-navy-800 mb-3" style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
                  Coming Soon
                </p>
                <p className="text-ink/70 leading-relaxed mb-6">
                  {product.name} is in development. Join the notification list and we&apos;ll email you the moment it&apos;s ready to ship.
                </p>
                <form
                  className="flex flex-col sm:flex-row gap-3 max-w-md"
                  aria-label={`Notify me when ${product.name} launches`}
                  action="/api/newsletter"
                  method="post"
                >
                  <label htmlFor={`notify-${product.sku}`} className="sr-only">
                    Email address
                  </label>
                  <input
                    id={`notify-${product.sku}`}
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="input flex-1"
                  />
                  <input type="hidden" name="sku" value={product.sku} />
                  <button type="submit" className="btn-primary whitespace-nowrap">
                    Notify me
                  </button>
                </form>
                <p className="mt-4 text-xs text-ink/55">
                  No spam, no other emails. We&apos;ll send you one note when {product.name} is in stock.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ProductShowcase product={product} currency={currency} heading={heading} />
        )}

        {product.labReport && !product.comingSoon ? (
          <div className="container pb-10 lg:pb-14">
            <a
              href={product.labReport.url}
              className="group flex items-start gap-4 p-5 rounded-md border border-ivory-300 hover:border-forest-400 hover:bg-ivory-100 transition-colors max-w-2xl lg:ml-auto"
              data-cursor="Download"
            >
              <FileText className="size-5 text-gold-500 mt-0.5 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/55 mb-1">
                  Certificate of analysis · batch {product.labReport.batchId}
                </p>
                <p className="font-display text-forest-800 text-lg leading-tight">
                  Third-party batch report
                </p>
                <p className="text-xs text-ink/60 mt-1">
                  {product.labReport.labName} · issued {new Date(product.labReport.issuedOn).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.22em] text-forest-700 group-hover:text-gold-500 self-center">
                PDF →
              </span>
            </a>
          </div>
        ) : null}
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
      <section id="how-to-use" className="container py-16 max-w-3xl scroll-mt-24">
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
            { icon: Leaf, title: "Third-party tested", body: "Independently verified." },
            { icon: ShieldCheck, title: "cGMP certified", body: "Manufactured to cGMP standards." },
            { icon: Award, title: "High-purity formula", body: "No magnesium stearate or silicon dioxide." },
            { icon: Zap, title: "Made in USA", body: "With globally sourced ingredients." },
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
          initial={published.map((r) => ({ ...r, rating: r.rating as 1 | 2 | 3 | 4 | 5 }))}
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
      {product.requiresDsheaDisclaimer ? <StickyDisclaimer /> : null}
      <Footer showDshea={product.requiresDsheaDisclaimer} />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { FlaskConical, Leaf, ShieldCheck, Droplets, ArrowRight } from "lucide-react";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { TestimonialBlock } from "@/components/marketing/TestimonialBlock";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { products } from "@/content/products";
import { testimonials } from "@/content/testimonials";
import { resolveCurrency } from "@/lib/currency";
import { asset } from "@/lib/assets";

export default function HomePage() {
  const currency = resolveCurrency();

  return (
    <>
      {/* Asymmetric hero with editorial overflow, atmosphere, and staggered entry */}
      <section className="relative bg-atmosphere overflow-hidden">
        <div className="container relative pt-16 pb-24 lg:pt-28 lg:pb-36">
          {/* Hero composition: 45/55 split, headline overflows container on desktop */}
          <div className="grid gap-10 lg:gap-0 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 lg:pr-8 relative z-10 stagger">
              <p className="eyebrow">Series 01 · The collection</p>
              <h1 className="text-hero text-forest-800 mt-6 text-balance">
                Wellness,<br />
                <span className="italic text-forest-700" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
                  measured.
                </span>
              </h1>
              <p className="mt-8 text-lg lg:text-xl text-ink/75 leading-relaxed max-w-xl">
                Supplements, cortisone-free skincare, and gravity-fed filtration, each built to a single research-grade specification.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="btn-primary group text-base px-6 py-3.5"
                >
                  Explore the collection
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/about" className="text-sm font-medium text-forest-700 hover:text-forest-900 underline underline-offset-4 decoration-gold-300 decoration-2">
                  Our philosophy
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-ink/50">
                <span>cGMP manufactured</span>
                <span aria-hidden className="size-1 rounded-full bg-gold-400" />
                <span>Third-party tested</span>
                <span aria-hidden className="size-1 rounded-full bg-gold-400" />
                <span>Research-grade</span>
              </div>
            </div>

            {/* Image/video slot breaks out slightly to overlap text on desktop.
                NEXT_PUBLIC_HERO_VIDEO_URL can be set to a CloudFront-hosted MP4
                (h.264 baseline, muted, looping) once brand footage exists. */}
            <div className="relative lg:col-span-5 lg:-mr-12 xl:-mr-24">
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-xl overflow-hidden shadow-card bg-ivory-200">
                {process.env.NEXT_PUBLIC_HERO_VIDEO_URL ? (
                  <video
                    src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL}
                    poster={asset("hero/home.jpg")}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={asset("hero/home.jpg")}
                    alt="Soft natural light on a studio arrangement of IP-6 Research products."
                    fill
                    priority
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="absolute -left-4 -bottom-4 hidden lg:block">
                <div className="w-24 h-[2px] bg-gold-400" />
                <p className="sku-serial mt-3 text-forest-800/70">IP6–CAT–26</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection */}
      <section aria-labelledby="collection-heading" className="container py-20 lg:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">The collection</p>
            <h2 id="collection-heading" className="text-display-lg font-display text-forest-800">
              Three products. <span className="italic text-forest-700">One standard.</span>
            </h2>
          </div>
          <Link href="/shop" className="btn-secondary">View all</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.sku} product={p} currency={currency} />
          ))}
        </div>
      </section>

      <FeatureGrid
        eyebrow="Why IP-6 Research"
        heading="What institutional standards actually mean."
        features={[
          {
            icon: FlaskConical,
            title: "95%+ purity IP6",
            body: "Supplements standardized to institutional research specifications. Every batch third-party tested for purity, potency, and heavy metals.",
          },
          {
            icon: ShieldCheck,
            title: "Cortisone-free formulation",
            body: "La Santé Cream is built for sensitive skin without corticosteroids. Formulated for skin affected by eczema and chronic sensitivity.",
          },
          {
            icon: Droplets,
            title: "Engineered filtration",
            body: "The IP6-Citrate filter removes lead and arsenic in under 60 seconds of contact time. Gravity-fed. No electricity. No plumbing.",
          },
          {
            icon: Leaf,
            title: "Quiet about claims",
            body: "We use structure-function language, not hype. What we won't say in marketing is part of what you're buying.",
          },
        ]}
      />

      {/* Editorial science strip, dark ground with gold accents */}
      <section className="relative bg-forest-800 text-ivory-100 py-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.18), transparent 55%)",
          }}
        />
        <div className="container grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-6">
            <p className="eyebrow text-gold-300 mb-4">The science</p>
            <h2 className="text-display-lg font-display mb-6">
              Restraint in claims.<br />
              <span className="italic text-gold-200">Rigor in formulation.</span>
            </h2>
            <span className="hairline-gold-left bg-gold-400 mb-6" />
            <p className="text-ivory-100/85 leading-relaxed mb-8 text-lg">
              A credible wellness brand is defined as much by what it refuses to say as by what it says. Every ingredient is selected for a specific, measurable role. Every batch is tested by an independent, ISO-accredited laboratory. Every claim on this site uses structure-function language. No shortcuts, no promises we cannot stand behind.
            </p>
            <Link href="/about" className="btn-gold">Read our approach</Link>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-card">
              <Image
                src={asset("hero/science.jpg")}
                alt="A researcher examines a sample under soft laboratory lighting."
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <TestimonialBlock testimonials={testimonials} />

      {/* Newsletter */}
      <section className="container py-20">
        <div className="max-w-2xl mx-auto text-center bg-ivory-200 rounded-xl p-10 border border-ivory-300/80">
          <p className="eyebrow mb-3">Stay in touch</p>
          <h2 className="text-display-md font-display text-forest-800 mb-4">
            Quiet updates.{" "}
            <span className="italic text-forest-700">No noise.</span>
          </h2>
          <p className="text-ink/75 mb-6">
            A monthly note on formulation, testing, and the research behind our products. Unsubscribe anytime.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <label htmlFor="home-newsletter" className="sr-only">Email address</label>
            <input
              id="home-newsletter"
              type="email"
              required
              placeholder="you@example.com"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

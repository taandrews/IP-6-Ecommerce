import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  ShieldCheck,
  Award,
  RefreshCw,
  FlaskConical,
  Truck,
  Leaf,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Stars } from "@/components/ui/Stars";
import { Footer } from "@/components/layout/Footer";
import { Grain } from "@/components/ui/Grain";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { products } from "@/content/products";
import { testimonials } from "@/content/testimonials";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { asset } from "@/lib/assets";

export default function HomePage() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.category === "supplement")!;
  const supplementFrom = Math.min(...supplement.variants.map((v) => v.priceCents[currency]));

  return (
    <>
      {/* Hero: product-forward, clear CTA, benefit strip */}
      <section className="relative bg-atmosphere overflow-hidden border-b border-ivory-300">
        <Grain intensity="subtle" blend="multiply" />
        <div className="container relative pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="stagger">
              <p className="eyebrow">Research-grade wellness</p>
              <h1
                className="font-display text-forest-800 text-balance mt-6"
                style={{
                  fontSize: "clamp(2.4rem, 5.5vw, 4.75rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                Three products.<br />
                <span
                  className="italic text-forest-700"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 90' }}
                >
                  One specification.
                </span>
              </h1>
              <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-xl">
                Pharmaceutical-grade IP6 supplement. Cortisone-free skincare. Gravity-fed water filtration. Each is built to a research-grade specification and tested by an independent laboratory.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/shop/${supplement.slug}`}
                  className="btn-primary text-base px-6 py-3.5 group"
                >
                  Shop IP6 Original · from {formatPrice(supplementFrom, currency)}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/science"
                  className="text-sm font-medium text-forest-700 hover:text-forest-900 underline underline-offset-4 decoration-gold-300 decoration-2"
                >
                  How it works
                </Link>
              </div>

              <ul className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5">
                {[
                  { n: "95%+", l: "IP6 purity" },
                  { n: "cGMP", l: "manufactured" },
                  { n: "ISO 17025", l: "lab tested" },
                  { n: "60s", l: "contact time" },
                ].map((i) => (
                  <li key={i.l}>
                    <p
                      className="font-display text-forest-800 leading-none"
                      style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)", fontVariationSettings: '"opsz" 72, "SOFT" 50' }}
                    >
                      {i.n}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-ink/60">{i.l}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative lg:-mr-12 xl:-mr-20">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-card bg-ivory-200">
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
                    src={asset("products/supplement-1.jpg")}
                    alt="IP6 Original Supplement on a linen backdrop."
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

      {/* What is IP6 */}
      <section className="container py-20 lg:py-24 max-w-5xl">
        <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
          <div>
            <p className="eyebrow mb-3">What is IP6?</p>
            <h2
              className="font-display text-forest-800 text-balance"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
            >
              A natural molecule, <span className="italic">standardized for consistency.</span>
            </h2>
          </div>
          <div className="space-y-5 text-ink/80 leading-relaxed lg:text-lg">
            <p>
              Inositol hexaphosphate (IP6) is a naturally occurring compound found in whole grains, legumes, seeds, and nuts. Our contract partner isolates the intact hexaphosphate fraction to 95%+ purity, verified by HPLC on every batch.
            </p>
            <p className="text-ink/70">
              That specification, not a proprietary blend, is the center of what we make. Read more on{" "}
              <Link
                href="/science"
                className="text-forest-700 underline underline-offset-4 decoration-gold-300 decoration-2 hover:text-forest-900"
              >
                The Science page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* The Collection */}
      <section id="shop" className="bg-ivory-200 py-20 lg:py-28 border-y border-ivory-300">
        <div className="container">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3">The collection</p>
              <h2
                className="font-display text-forest-800"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
              >
                Shop all three.
              </h2>
            </div>
            <Link href="/shop" className="btn-secondary">View full collection</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.sku} product={p} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      {/* Subscription savings */}
      <section className="container py-20 lg:py-24">
        <div className="rounded-xl bg-forest-800 text-ivory-100 p-10 lg:p-14 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center overflow-hidden relative">
          <Grain intensity="medium" blend="screen" />
          <div className="relative">
            <p className="eyebrow text-gold-300 mb-4">Subscribe & save</p>
            <h2
              className="font-display text-balance"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
            >
              Save up to 20% on your routine.
            </h2>
            <p className="mt-5 text-ivory-100/85 leading-relaxed max-w-lg">
              Deliveries on your chosen cycle. Pause, skip, or cancel anytime from your account. No automated upsells, no shipping surprises.
            </p>
          </div>
          <div className="relative grid sm:grid-cols-3 gap-4 text-center">
            {[
              { pct: "15%", cycle: "Every 30d" },
              { pct: "18%", cycle: "Every 60d" },
              { pct: "20%", cycle: "Every 90d" },
            ].map((c) => (
              <div key={c.cycle} className="rounded-lg border border-gold-300/40 p-4">
                <p
                  className="font-display text-gold-300"
                  style={{ fontSize: "2.25rem", lineHeight: 1, fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.02em" }}
                >
                  {c.pct}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-ivory-100/75">{c.cycle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting started */}
      <section className="bg-surface py-20 lg:py-24 border-t border-ivory-300">
        <div className="container max-w-6xl">
          <div className="max-w-2xl mb-14">
            <p className="eyebrow mb-3">Getting started</p>
            <h2
              className="font-display text-forest-800"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
            >
              Straightforward, <span className="italic">without the hype.</span>
            </h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Beaker,
                title: "Choose your product",
                body: "Pick the product or bundle that fits your routine. Each page details the specification, ingredients, and testing.",
              },
              {
                step: "02",
                icon: RefreshCw,
                title: "Subscribe or one-time",
                body: "Save up to 20% on subscriptions. Change frequency, pause, or cancel in one click from your account.",
              },
              {
                step: "03",
                icon: Truck,
                title: "Delivered worldwide",
                body: "Tracked shipping to most countries. Filter ships globally; supplement and skincare ship to permitted regions.",
              },
            ].map((s) => (
              <li key={s.step} className="card p-8 border-l-4 border-l-gold-400">
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="font-display italic"
                    style={{ fontSize: "1.5rem", fontVariationSettings: '"opsz" 72, "SOFT" 90', color: "rgb(176 142 53)" }}
                  >
                    {s.step}
                  </span>
                  <s.icon className="size-5 text-forest-600" aria-hidden />
                </div>
                <h3
                  className="font-display text-xl text-forest-800 mb-2"
                  style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}
                >
                  {s.title}
                </h3>
                <p className="text-sm text-ink/75 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Our standards */}
      <section className="bg-ivory-200 py-20 lg:py-24">
        <div className="container max-w-6xl">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-3">Our standards</p>
            <h2
              className="font-display text-forest-800"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
            >
              Tested every batch. <span className="italic">Documented every time.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FlaskConical, title: "95%+ IP6 purity", body: "Verified by HPLC on every batch" },
              { icon: ShieldCheck, title: "cGMP facility", body: "Pharmaceutical-grade manufacturing" },
              { icon: Award, title: "ISO 17025 tested", body: "Heavy metals, microbial, allergens" },
              { icon: Leaf, title: "Structure-function", body: "DSHEA-compliant claim language" },
            ].map((i) => (
              <div key={i.title} className="bg-surface rounded-lg p-6 border border-ivory-300">
                <i.icon className="size-5 mb-4" aria-hidden style={{ color: "rgb(176 142 53)" }} />
                <h3
                  className="font-display text-lg text-forest-800 mb-2"
                  style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}
                >
                  {i.title}
                </h3>
                <p className="text-sm text-ink/70 leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container py-20 lg:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Reviews</p>
            <h2
              className="font-display text-forest-800"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
            >
              What customers say.
            </h2>
          </div>
          <Link href="/testimonials" className="btn-secondary">All reviews</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t) => (
            <figure key={t.id} className="card p-6 flex flex-col">
              <Stars rating={t.rating} />
              <blockquote className="mt-4 text-ink/85 italic leading-relaxed flex-1">
                &ldquo;{t.body}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-4 border-t border-ivory-300 text-sm">
                <span className="font-medium text-forest-800">{t.authorName}</span>
                {t.location ? <span className="text-ink/60"> · {t.location}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="bg-surface py-20 lg:py-24 border-t border-ivory-300">
        <div className="container max-w-4xl">
          <div className="max-w-2xl mb-10">
            <p className="eyebrow mb-3">Questions</p>
            <h2
              className="font-display text-forest-800"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.05, fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
            >
              Frequent answers.
            </h2>
          </div>
          <dl className="divide-y divide-ivory-300 border-y border-ivory-300">
            {[
              {
                q: "What is IP6 and where does it come from?",
                a: "Inositol hexaphosphate is a naturally occurring compound in whole grains, legumes, seeds, and nuts. Our supplement is sourced from rice bran and isolated to 95%+ purity.",
              },
              {
                q: "Is every product third-party tested?",
                a: "Yes. Every batch is tested by an ISO 17025-accredited laboratory for purity, potency, heavy metals, and microbial contamination. Certificates of analysis are available on each product page.",
              },
              {
                q: "How do subscriptions work?",
                a: "Choose your cycle at checkout (30, 60, or 90 days depending on product). Save up to 20%. Skip, pause, or cancel from your account dashboard anytime.",
              },
              {
                q: "Where do you ship?",
                a: "The water filter ships worldwide. Supplements and skincare ship to a curated list of countries. See International Shipping for the current list.",
              },
            ].map((f, i) => (
              <div key={i} className="py-6">
                <dt
                  className="font-display text-forest-800 text-lg mb-2"
                  style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}
                >
                  {f.q}
                </dt>
                <dd className="text-ink/75 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm font-medium text-forest-700 hover:text-forest-900 underline underline-offset-4 decoration-gold-300 decoration-2"
            >
              See all FAQs →
            </Link>
          </div>
        </div>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

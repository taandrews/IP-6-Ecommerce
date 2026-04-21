import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Award, RefreshCw, FlaskConical, Truck, CheckCircle2 } from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { Grain } from "@/components/ui/Grain";
import { products } from "@/content/products";
import { testimonials } from "@/content/testimonials";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { asset } from "@/lib/assets";
import type { Product } from "@/types";

export default function HomePage() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.category === "supplement")!;
  const skincare = products.find((p) => p.category === "skincare")!;
  const filter = products.find((p) => p.category === "filter")!;
  const supplementFrom = Math.min(...supplement.variants.map((v) => v.priceCents[currency]));

  return (
    <>
      {/* =========== HERO =========== */}
      {/* Product-as-hero. Massive supplement image dominates; copy is tight, CTA is primary. */}
      <section className="relative bg-atmosphere overflow-hidden border-b border-ivory-300">
        <Grain intensity="subtle" blend="multiply" />
        <div className="container relative pt-10 pb-0 lg:pt-16 lg:pb-0">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] items-end">
            <div className="pb-16 lg:pb-28 stagger">
              <p className="eyebrow">Pharmaceutical-grade IP6</p>
              <h1
                className="font-display text-forest-800 text-balance mt-6"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.035em",
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                IP6 Original.<br />
                <span className="italic text-forest-700" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 90' }}>
                  95% pure.
                </span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-ink/75 leading-relaxed max-w-lg">
                Inositol hexaphosphate, isolated to 95%+ purity and verified by HPLC on every batch. Supports immune health and healthy cell function.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/shop/${supplement.slug}`}
                  className="btn-primary text-base px-7 py-4 group"
                >
                  Shop · {formatPrice(supplementFrom, currency)}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/science"
                  className="text-sm font-medium text-forest-700 hover:text-forest-900 underline underline-offset-4 decoration-gold-300 decoration-2"
                >
                  How it works →
                </Link>
              </div>
            </div>

            {/* Massive product image, bottom-aligned so it anchors the hero */}
            <div className="relative lg:-mr-20 xl:-mr-36">
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-xl overflow-hidden shadow-card bg-ivory-200">
                {process.env.NEXT_PUBLIC_HERO_VIDEO_URL ? (
                  <video
                    src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL}
                    poster={asset("products/supplement-1.jpg")}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={asset("products/supplement-1.jpg")}
                    alt="IP6 Original Supplement, 60-count capsules."
                    fill
                    priority
                    sizes="(min-width: 1024px) 720px, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              {/* Outcome datum floating on image */}
              <div className="absolute bottom-6 left-6 bg-surface/95 backdrop-blur-sm rounded-md px-5 py-4 shadow-soft">
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Verified</p>
                <p
                  className="font-display text-forest-800 leading-none mt-1"
                  style={{ fontSize: "2rem", fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.02em" }}
                >
                  95.3%
                </p>
                <p className="text-[11px] text-ink/60 mt-0.5">IP6 intact · HPLC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-ivory-300 bg-surface/60 backdrop-blur-sm">
          <div className="container py-5 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-ink/65">
            <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-forest-600" /> cGMP manufactured</span>
            <span className="flex items-center gap-2"><Award className="size-3.5 text-forest-600" /> ISO 17025 tested</span>
            <span className="flex items-center gap-2"><RefreshCw className="size-3.5 text-forest-600" /> Save up to 20%</span>
            <span className="flex items-center gap-2"><Truck className="size-3.5 text-forest-600" /> Shipped worldwide</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-forest-600" /> 30-day returns</span>
          </div>
        </div>
      </section>

      {/* =========== PER-PRODUCT BANDS =========== */}
      {/* Each product gets its own full-width band: huge image, outcome-led headline, spec callouts, primary CTA. */}
      <ProductBand
        index={1}
        product={supplement}
        currency={currency}
        imageKey="products/supplement-1.jpg"
        outcomeLine="95%+ purity. Third-party tested. Every batch."
        dataPoints={[
          { n: "95%+", l: "IP6 purity, HPLC verified" },
          { n: "500mg", l: "per capsule" },
          { n: "60", l: "capsule starter" },
        ]}
      />

      <ProductBand
        index={2}
        product={skincare}
        currency={currency}
        imageKey="products/cream-1.jpg"
        reversed
        outcomeLine="Cortisone-free. Formulated for skin affected by eczema."
        dataPoints={[
          { n: "0%", l: "corticosteroids" },
          { n: "Cer-NP", l: "ceramide base" },
          { n: "50ml", l: "per jar" },
        ]}
        darkBackground
      />

      <ProductBand
        index={3}
        product={filter}
        currency={currency}
        imageKey="products/filter-1.jpg"
        outcomeLine="Lead and arsenic removed in under 60 seconds of flow time."
        dataPoints={[
          { n: "60s", l: "contact time" },
          { n: "0W", l: "electricity required" },
          { n: "3.8L", l: "reservoir capacity" },
        ]}
      />

      {/* =========== OUTCOMES STRIP =========== */}
      <section className="bg-forest-800 text-ivory-100 py-20 relative overflow-hidden">
        <Grain intensity="medium" blend="screen" />
        <div className="container relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
          {[
            { n: "200+", l: "Peer-reviewed publications by the founder" },
            { n: "95.3%", l: "Average IP6 purity across production batches" },
            { n: "< 60s", l: "Filtration contact time for lead and arsenic" },
            { n: "50k+", l: "Subscriptions managed from the dashboard" },
          ].map((i) => (
            <div key={i.l}>
              <p
                className="font-display text-gold-300 leading-none"
                style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.025em" }}
              >
                {i.n}
              </p>
              <p className="mt-3 text-sm text-ivory-100/80 leading-relaxed max-w-[22ch] mx-auto">{i.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========== SUBSCRIPTION =========== */}
      <section className="container py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Subscribe & save</p>
            <h2
              className="font-display text-forest-800"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, fontVariationSettings: '"opsz" 96, "SOFT" 40', letterSpacing: "-0.02em" }}
            >
              Save up to 20%. <span className="italic">Cancel anytime.</span>
            </h2>
          </div>
          <Link href="/shop" className="btn-primary">Start a subscription</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { pct: "15%", cycle: "Every 30 days", note: "For daily users" },
            { pct: "18%", cycle: "Every 60 days", note: "Our most popular" },
            { pct: "20%", cycle: "Every 90 days", note: "Biggest savings" },
          ].map((c) => (
            <div key={c.cycle} className="rounded-lg border border-ivory-300 p-6">
              <p
                className="font-display text-forest-800 leading-none"
                style={{ fontSize: "3rem", fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.03em" }}
              >
                {c.pct}
              </p>
              <p className="mt-3 text-sm font-medium text-forest-800">{c.cycle}</p>
              <p className="text-xs text-ink/60 mt-1">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========== REVIEWS =========== */}
      <section className="bg-ivory-200 py-20 border-y border-ivory-300">
        <div className="container">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="eyebrow mb-2">Reviews</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2
                  className="font-display text-forest-800"
                  style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1, fontVariationSettings: '"opsz" 96, "SOFT" 40', letterSpacing: "-0.02em" }}
                >
                  Rated 4.9
                </h2>
                <Stars rating={4.9} size={18} />
                <span className="text-sm text-ink/60">6 verified reviews</span>
              </div>
            </div>
            <Link href="/testimonials" className="btn-secondary text-sm">All reviews</Link>
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
        </div>
      </section>

      {/* =========== STANDARDS =========== */}
      <section className="container py-20 lg:py-24 max-w-6xl">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-3">Standards</p>
          <h2
            className="font-display text-forest-800"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, fontVariationSettings: '"opsz" 96, "SOFT" 40', letterSpacing: "-0.02em" }}
          >
            What every batch is tested for.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { k: "Purity", v: "95%+ intact IP6 (HPLC)" },
            { k: "Potency", v: "Label-claim ± 5%" },
            { k: "Heavy metals", v: "USP <232> limits" },
            { k: "Microbial", v: "Full panel + allergens" },
          ].map((i) => (
            <div key={i.k} className="border-t border-ivory-300 pt-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-ink/60">{i.k}</p>
              <p
                className="font-display text-forest-800 mt-2"
                style={{ fontSize: "1.25rem", fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
              >
                {i.v}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/science" className="text-sm font-medium text-forest-700 hover:text-forest-900 underline underline-offset-4 decoration-gold-300 decoration-2">
            Read the full specification →
          </Link>
        </div>
      </section>

      <StickyCTA
        label="IP6 Original Supplement"
        sublabel="95%+ purity · verified every batch"
        href={`/shop/${supplement.slug}`}
        price={formatPrice(supplementFrom, currency)}
      />
      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

/* ----------------------------------------------------------- */

function ProductBand({
  index,
  product,
  currency,
  imageKey,
  outcomeLine,
  dataPoints,
  reversed = false,
  darkBackground = false,
}: {
  index: number;
  product: Product;
  currency: "USD" | "CAD" | "GBP" | "AUD" | "EUR" | "INR";
  imageKey: string;
  outcomeLine: string;
  dataPoints: { n: string; l: string }[];
  reversed?: boolean;
  darkBackground?: boolean;
}) {
  const from = Math.min(...product.variants.map((v) => v.priceCents[currency]));
  const bg = darkBackground
    ? "bg-forest-800 text-ivory-100"
    : index % 2 === 0
      ? "bg-surface"
      : "bg-ivory-200";
  const muted = darkBackground ? "text-ivory-100/75" : "text-ink/70";
  const eyebrowColor = darkBackground ? "text-gold-300" : "text-forest-600";
  const hairlineColor = darkBackground ? "bg-gold-300" : "bg-gold-400";

  return (
    <section className={`relative overflow-hidden ${bg} py-20 lg:py-28 border-b border-ivory-300/60`}>
      <Grain intensity={darkBackground ? "heavy" : "subtle"} blend={darkBackground ? "screen" : "multiply"} />
      <div className="container relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Text column */}
        <div className={reversed ? "order-1 lg:order-2" : ""}>
          <div className="flex items-center gap-3 mb-5">
            <span className={`font-display italic ${eyebrowColor}`} style={{ fontSize: "1.5rem", fontVariationSettings: '"opsz" 72, "SOFT" 90' }}>
              0{index}
            </span>
            <span className={`h-px w-10 ${hairlineColor}`} aria-hidden />
            <span className={`eyebrow ${eyebrowColor}`}>
              {product.category === "supplement"
                ? "Supplement"
                : product.category === "skincare"
                  ? "Skincare"
                  : "Water filtration"}
            </span>
          </div>

          <h2
            className="font-display text-balance"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
              fontVariationSettings: '"opsz" 144, "SOFT" 40',
            }}
          >
            {product.name}
          </h2>
          <p
            className={`mt-4 font-display italic ${darkBackground ? "text-gold-300" : "text-forest-700"}`}
            style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.35rem)", fontVariationSettings: '"opsz" 72, "SOFT" 90' }}
          >
            {outcomeLine}
          </p>

          <p className={`mt-6 ${muted} leading-relaxed text-lg max-w-xl`}>
            {product.shortDescription}
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
            {dataPoints.map((d) => (
              <div key={d.l}>
                <dt
                  className="font-display leading-none"
                  style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", fontVariationSettings: '"opsz" 96, "SOFT" 50', letterSpacing: "-0.025em" }}
                >
                  {d.n}
                </dt>
                <dd className={`mt-2 text-[11px] uppercase tracking-[0.22em] ${darkBackground ? "text-ivory-100/60" : "text-ink/55"} leading-snug`}>
                  {d.l}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex items-center gap-4 flex-wrap">
            <Link
              href={`/shop/${product.slug}`}
              className={
                darkBackground
                  ? "btn-gold text-base px-6 py-3.5 group"
                  : "btn-primary text-base px-6 py-3.5 group"
              }
            >
              Shop · {formatPrice(from, currency)}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={`/shop/${product.slug}#how-it-works`}
              className={`text-sm font-medium underline underline-offset-4 decoration-gold-300 decoration-2 ${darkBackground ? "text-ivory-100 hover:text-gold-300" : "text-forest-700 hover:text-forest-900"}`}
            >
              How it works →
            </Link>
          </div>
        </div>

        {/* Image column */}
        <div className={reversed ? "order-2 lg:order-1" : ""}>
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-card bg-ivory-200">
            <Image
              src={asset(imageKey)}
              alt={`${product.name} product photograph.`}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

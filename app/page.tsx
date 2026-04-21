import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Award,
  RefreshCw,
  FlaskConical,
  Truck,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { StickyCTA } from "@/components/layout/StickyCTA";
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
      {/* HERO — clinical, product-first */}
      <section className="relative bg-cloud-100 border-b border-cloud-300">
        <div className="container pt-14 lg:pt-20 pb-0">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-end">
            <div className="pb-16 lg:pb-24 stagger">
              <p className="eyebrow">Pharmaceutical-grade IP6</p>
              <h1 className="text-hero text-navy-800 text-balance mt-5">
                IP6 Original.<br />
                95%+ purity, <span className="text-sky-600">verified.</span>
              </h1>
              <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-lg">
                Inositol hexaphosphate, isolated to 95%+ purity and verified by HPLC on every batch. Supports immune health and healthy cell function.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/shop/${supplement.slug}`} className="btn-primary group">
                  Shop · {formatPrice(supplementFrom, currency)}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/science"
                  className="text-sm font-semibold text-navy-800 hover:text-sky-600 underline underline-offset-4 decoration-sky-300 decoration-2"
                >
                  How it works
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-lg overflow-hidden bg-cloud-200 shadow-card">
                <Image
                  src={asset("products/supplement-1.jpg")}
                  alt="IP6 Original Supplement bottle, front view."
                  fill
                  priority
                  sizes="(min-width: 1024px) 540px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-5 left-5 bg-surface rounded-md px-5 py-4 shadow-card border border-cloud-300">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-semibold">Verified</p>
                <p className="font-sans font-bold text-navy-800 leading-none mt-1.5" style={{ fontSize: "2.25rem", letterSpacing: "-0.025em" }}>
                  95.3<span className="text-sky-600">%</span>
                </p>
                <p className="text-[11px] text-ink/60 mt-1">IP6 intact · HPLC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-cloud-300 bg-surface">
          <div className="container py-5 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-ink/65 font-semibold">
            <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-sky-600" /> cGMP manufactured</span>
            <span className="flex items-center gap-2"><Award className="size-3.5 text-sky-600" /> ISO 17025 tested</span>
            <span className="flex items-center gap-2"><RefreshCw className="size-3.5 text-sky-600" /> Save up to 20%</span>
            <span className="flex items-center gap-2"><Truck className="size-3.5 text-sky-600" /> Worldwide shipping</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-sky-600" /> 30-day returns</span>
          </div>
        </div>
      </section>

      {/* PRODUCT BANDS */}
      <ProductBand
        index={1}
        product={supplement}
        currency={currency}
        imageKey="products/supplement-1.jpg"
        outcomeLine="95%+ purity. Verified by HPLC every batch."
        dataPoints={[
          { n: "95%+", l: "IP6 purity" },
          { n: "500mg", l: "per capsule" },
          { n: "60ct", l: "starter size" },
        ]}
      />
      <ProductBand
        index={2}
        product={skincare}
        currency={currency}
        imageKey="products/cream-1.jpg"
        reversed
        background="cloud"
        outcomeLine="Cortisone-free. Formulated for skin affected by eczema."
        dataPoints={[
          { n: "0%", l: "corticosteroids" },
          { n: "Cer-NP", l: "ceramide base" },
          { n: "50ml", l: "per jar" },
        ]}
      />
      <ProductBand
        index={3}
        product={filter}
        currency={currency}
        imageKey="products/filter-1.jpg"
        outcomeLine="Lead and arsenic removed in under 60 seconds."
        dataPoints={[
          { n: "60s", l: "contact time" },
          { n: "0W", l: "electricity" },
          { n: "3.8L", l: "reservoir" },
        ]}
      />

      {/* OUTCOMES — single dark band */}
      <section className="bg-navy-800 text-surface py-20">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { n: "200+", l: "Peer-reviewed publications by the founder" },
            { n: "95.3%", l: "Average IP6 purity across batches" },
            { n: "<60s", l: "Filtration contact time for heavy metals" },
            { n: "50,000+", l: "Subscriptions managed" },
          ].map((i) => (
            <div key={i.l} className="border-l-2 border-sky-400 pl-5">
              <p className="font-sans font-bold text-surface leading-none" style={{ fontSize: "clamp(2.25rem, 4vw, 3rem)", letterSpacing: "-0.025em" }}>
                {i.n}
              </p>
              <p className="mt-3 text-sm text-surface/80 leading-relaxed max-w-[26ch]">{i.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SUBSCRIBE & SAVE */}
      <section className="container py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Subscribe & save</p>
            <h2 className="font-sans font-semibold text-navy-800" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              Save up to 20%. Cancel anytime.
            </h2>
            <p className="mt-4 text-ink/70 text-lg max-w-xl">
              Choose your delivery cycle. Skip, pause, or cancel from your account in one click.
            </p>
          </div>
          <Link href="/shop" className="btn-primary">Start a subscription</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { pct: "15%", cycle: "Every 30 days", note: "For daily users" },
            { pct: "18%", cycle: "Every 60 days", note: "Most popular" },
            { pct: "20%", cycle: "Every 90 days", note: "Biggest savings" },
          ].map((c) => (
            <div key={c.cycle} className="rounded-lg border border-cloud-300 p-6 bg-surface hover:border-sky-400 transition-colors">
              <p className="font-sans font-bold text-navy-800 leading-none" style={{ fontSize: "2.75rem", letterSpacing: "-0.03em" }}>
                {c.pct}
              </p>
              <p className="mt-3 text-sm font-semibold text-navy-800">{c.cycle}</p>
              <p className="text-xs text-ink/60 mt-1">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-cloud-200 py-20 border-y border-cloud-300">
        <div className="container">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="eyebrow mb-2">Reviews</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="font-sans font-semibold text-navy-800" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.02em", lineHeight: 1 }}>
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
                <blockquote className="mt-4 text-ink/85 leading-relaxed flex-1">
                  &ldquo;{t.body}&rdquo;
                </blockquote>
                <figcaption className="mt-6 pt-4 border-t border-cloud-300 text-sm">
                  <span className="font-semibold text-navy-800">{t.authorName}</span>
                  {t.location ? <span className="text-ink/60"> · {t.location}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="container py-20 lg:py-24 max-w-6xl">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-3">Standards</p>
          <h2 className="font-sans font-semibold text-navy-800" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            What every batch is tested for.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: FlaskConical, k: "Purity", v: "95%+ IP6", note: "HPLC verified" },
            { icon: ShieldCheck, k: "Potency", v: "Label ±5%", note: "Per assay" },
            { icon: Award, k: "Heavy metals", v: "USP <232>", note: "Pb, As, Cd, Hg" },
            { icon: FileText, k: "Microbial", v: "Full panel", note: "Plus allergens" },
          ].map((i) => (
            <div key={i.k} className="rounded-lg border border-cloud-300 p-6 bg-surface">
              <i.icon className="size-5 text-sky-600 mb-4" aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-semibold">{i.k}</p>
              <p className="font-sans font-bold text-navy-800 mt-1" style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
                {i.v}
              </p>
              <p className="text-xs text-ink/60 mt-1">{i.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/science" className="text-sm font-semibold text-navy-800 hover:text-sky-600 underline underline-offset-4 decoration-sky-300 decoration-2">
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
  background = "white",
}: {
  index: number;
  product: Product;
  currency: "USD" | "CAD" | "GBP" | "AUD" | "EUR" | "INR";
  imageKey: string;
  outcomeLine: string;
  dataPoints: { n: string; l: string }[];
  reversed?: boolean;
  background?: "white" | "cloud";
}) {
  const from = Math.min(...product.variants.map((v) => v.priceCents[currency]));
  const bg = background === "cloud" ? "bg-cloud-200" : "bg-surface";

  return (
    <section className={`${bg} py-20 lg:py-28 border-b border-cloud-300`}>
      <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className={reversed ? "order-1 lg:order-2" : ""}>
          <p className="eyebrow mb-4">
            0{index} ·{" "}
            {product.category === "supplement"
              ? "Supplement"
              : product.category === "skincare"
                ? "Skincare"
                : "Water filtration"}
          </p>
          <h2 className="font-sans font-semibold text-navy-800 text-balance" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            {product.name}
          </h2>
          <p className="mt-4 font-sans font-semibold text-sky-700 text-lg">
            {outcomeLine}
          </p>
          <p className="mt-5 text-ink/70 leading-relaxed text-lg max-w-xl">
            {product.shortDescription}
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 max-w-lg pb-10 border-b border-cloud-300">
            {dataPoints.map((d) => (
              <div key={d.l}>
                <dt className="font-sans font-bold text-navy-800 leading-none" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", letterSpacing: "-0.025em" }}>
                  {d.n}
                </dt>
                <dd className="mt-2 text-[11px] uppercase tracking-[0.2em] text-ink/55 leading-snug font-semibold">
                  {d.l}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link href={`/shop/${product.slug}`} className="btn-primary group">
              Shop · {formatPrice(from, currency)}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={`/shop/${product.slug}`}
              className="text-sm font-semibold text-navy-800 hover:text-sky-600 underline underline-offset-4 decoration-sky-300 decoration-2"
            >
              Learn more →
            </Link>
          </div>
        </div>

        <div className={reversed ? "order-2 lg:order-1" : ""}>
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-card bg-cloud-200">
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

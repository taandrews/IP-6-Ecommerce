import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Award,
  RefreshCw,
  Truck,
  CheckCircle2,
  FlaskConical,
  Beaker,
  AlertTriangle,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { asset } from "@/lib/assets";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";

export default function HomePage() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
  const supplementFrom = Math.min(
    ...supplement.variants.map((v) => v.priceCents[currency]),
  );

  return (
    <>
      {/* =============================================
         CHAPTER 1 - HOOK
         "There is only one IP6 Original."
         From the lab of Prof. Shamsuddin. One supplement.
      ============================================== */}
      <section className="relative bg-surface">
        <div className="container pt-12 lg:pt-20 pb-16 lg:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-6">
              From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD
            </p>
            <h1
              className="font-serif text-navy-800 text-balance"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(2.75rem, 5.5vw, 5.5rem)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                fontWeight: 400,
              }}
            >
              There is only one <span className="text-sky-700">IP6 Original</span>.
            </h1>
            <p className="mt-7 text-lg lg:text-xl text-ink/75 leading-relaxed max-w-xl">
              The original IP6 formula, formulated by the physician-scientist who pioneered the research behind it. One supplement, made to the specification his work describes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href={`/shop/${supplement.slug}`}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-7 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original · {formatPrice(supplementFrom, currency)}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/story"
                className="text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-sky-300 decoration-2"
              >
                Read the story
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* Bottle floats on the page - no box, no shadow, no fill behind it.
               Height is capped so the bottle stays a reasonable size in the hero
               instead of filling a tall aspect box. */}
            <div className="relative h-[340px] sm:h-[420px] lg:h-[520px]">
              <Image
                src="/products/supplement-real.png"
                alt="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
                fill
                priority
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-contain"
              />
            </div>
            {/* Label badges - taken verbatim from the packaging, no invented stats.
               Sits beneath the bottle so it never overlaps the image. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-ink/60 font-semibold">
              <span>cGMP Certified</span>
              <span aria-hidden className="text-gold-500">·</span>
              <span>Third-Party Tested</span>
              <span aria-hidden className="text-gold-500">·</span>
              <span>High-Purity Formula</span>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-cloud-300 bg-surface">
          <div className="container py-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-ink/65 font-semibold">
            <span className="flex items-center gap-2">
              <Award className="size-3.5 text-sky-700" /> cGMP Certified
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-sky-700" /> Third-Party Tested
            </span>
            <span className="flex items-center gap-2">
              <FlaskConical className="size-3.5 text-sky-700" /> High-Purity Formula
            </span>
            <span className="flex items-center gap-2">
              <Truck className="size-3.5 text-sky-700" /> Ships US &amp; Canada
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-sky-700" /> 30-day returns
            </span>
          </div>
        </div>
      </section>

      {/* =============================================
         PRIMER - What IP6 and Inositol are.
         A short orientation that lands before the purity argument,
         so a first-time visitor knows the molecule before comparing it.
      ============================================== */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-20">
        <div className="container max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
            First, the molecule
          </p>
          <p className="font-serif text-xl lg:text-2xl text-navy-800/85 leading-relaxed">
            IP6 is{" "}
            <strong className="text-navy-800 font-semibold">inositol hexaphosphate</strong>, a molecule found naturally in seeds, grains, and legumes, where it stores energy and minerals. IP6 Original pairs it with{" "}
            <strong className="text-navy-800 font-semibold">Inositol</strong>, the simpler compound at its core, the way Prof. Shamsuddin&rsquo;s research describes the two. Knowing what the molecule is makes the next question, how pure is it, the one that matters.
          </p>
        </div>
      </section>

      {/* =============================================
         CHAPTER 2 - STAKES
         "Most IP6 on shelves is not the molecule his research described."
         Side by side purity bar.
      ============================================== */}
      <section className="bg-surface py-20 lg:py-28">
        <div className="container max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
            The Stakes
          </p>
          <h2
            className="font-serif text-navy-800 text-balance"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Most IP6 on shelves is not the molecule his research described.
          </h2>
          <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Most IP6 sold today is a commodity ingredient with no connection to the original research. IP6 Original is the formula the scientist who pioneered that research built himself: a high-purity formula, third-party tested, manufactured in a cGMP-certified facility.
          </p>

          {/* Specification table. Marks and short text, our column tinted. */}
          <ComparisonTable className="mt-12 lg:mt-16" />

          <div className="mt-12">
            <Link
              href="/the-difference"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 underline underline-offset-4 decoration-sky-300 decoration-2"
            >
              See the full comparison
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =============================================
         CHAPTER 4 - PROOF (4-tile credential strip)
         Soft white ground. Color lives in the gold rule and serif numerals.
      ============================================== */}
      <section className="bg-surface py-20 lg:py-24 border-t border-cloud-300">
        <div className="container max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
            The Proof
          </p>
          <h2
            className="font-serif text-navy-800 text-balance mb-14 lg:mb-16 max-w-3xl"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Made to the standard the research describes.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-10">
            {[
              {
                n: "1998",
                l: "First paper",
                d: "Prof. Shamsuddin publishes his first paper on inositol hexaphosphate at the University of Maryland School of Medicine.",
              },
              {
                n: "1,000",
                u: "mg",
                l: "Per serving",
                d: "804 mg IP6 and 196 mg Inositol in every 2-capsule serving, the pairing his research describes.",
              },
              {
                n: "0",
                l: "Processing additives",
                d: "No magnesium stearate, no silicon dioxide. A plant-based cellulose capsule and nothing else.",
              },
              {
                n: "1",
                l: "Named formulator",
                d: "One supplement, formulated by the scientist behind the research, made in a cGMP-certified facility and third-party tested.",
              },
            ].map((c) => (
              <div key={c.l}>
                <p
                  className="text-navy-800 tabular-nums whitespace-nowrap"
                  style={{ fontSize: "clamp(2.75rem, 4.5vw, 4rem)", lineHeight: 1, letterSpacing: "-0.03em", fontWeight: 400 }}
                >
                  {c.n}
                  {"u" in c && c.u ? (
                    <span className="ml-1 align-baseline text-[0.4em] font-medium tracking-normal text-ink/60">{c.u}</span>
                  ) : null}
                </p>
                <span aria-hidden className="mt-5 mb-4 block border-t border-dotted border-navy-800/35" />
                <p className="font-semibold text-navy-800">{c.l}</p>
                <p className="mt-2 text-sm text-ink/65 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
         THE FOUNDER (compact)
         Headshot, name, credentials, one line, link to the full story.
      ============================================== */}
      <section className="bg-surface py-20 lg:py-24 border-t border-cloud-300">
        <div className="container max-w-5xl grid sm:grid-cols-[220px_1fr] lg:grid-cols-[300px_1fr] gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cloud-200 max-w-[300px]">
            <Image
              src={asset("founder/shamsuddin.png")}
              alt="Portrait of Professor AbulKalam M. Shamsuddin, MD, PhD, founder and formulator of IP6 Original."
              fill
              sizes="(min-width: 1024px) 300px, 220px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
              The Founder
            </p>
            <h2
              className="text-navy-800 text-balance"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              Prof. AbulKalam M. Shamsuddin, MD, PhD
            </h2>
            <p className="mt-3 font-serif text-lg text-ink/70 leading-snug">
              Physician-scientist, University of Maryland School of Medicine. Founder and formulator of IP6 Original.
            </p>
            <blockquote className="mt-7 font-serif italic text-xl lg:text-2xl text-navy-800 leading-relaxed border-l-2 border-gold-500 pl-5">
              &ldquo;IP6 Original is the supplement built to the specification his own research describes.&rdquo;
            </blockquote>
            <div className="mt-8">
              <Link
                href="/story#founder"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-gold-500 decoration-2"
              >
                Meet Prof. Shamsuddin
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* =============================================
         CHAPTER 3 EXIT-RAMP - The Solution (product card link)
         The first IP6 supplement standardized to research-grade purity.
      ============================================== */}
      <section className="bg-gold-50 py-20 lg:py-24">
        <div className="container max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
            The Solution
          </p>
          <h2
            className="font-serif text-navy-800 text-balance"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            The first IP6 supplement standardized to research-grade purity.
          </h2>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            A high-purity formula, third-party tested, manufactured in a cGMP-certified facility, formulated by the scientist who pioneered the research behind it.
          </p>

          <Link
            href={`/shop/${supplement.slug}`}
            className="mt-10 group block rounded-2xl border border-gold-200 bg-surface hover:border-gold-500 transition-colors max-w-2xl shadow-soft"
          >
            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-square sm:aspect-auto">
                <Image
                  src="/products/supplement-real.png"
                  alt=""
                  fill
                  sizes="180px"
                  className="object-contain p-3"
                />
              </div>
              <div className="p-6 lg:p-7 flex flex-col">
                <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700 font-bold mb-2">
                  IP6 Original Supplement
                </p>
                <h3 className="font-serif text-navy-800 text-xl lg:text-2xl mb-2"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400 }}>
                  Pioneer in IP6 Research and Cellular Health
                </h3>
                <p className="text-sm text-ink/65 mb-5 flex-1">
                  120 capsules · 60 servings · 804 mg IP6 and 196 mg Inositol per serving. cGMP manufactured. Third-party tested.
                </p>
                <div className="flex items-center justify-between">
                  <p>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-semibold block">
                      From
                    </span>
                    <span className="font-serif text-navy-800 text-2xl"
                      style={{ fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400 }}>
                      {formatPrice(supplementFrom, currency)}
                    </span>
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 group-hover:text-sky-800">
                    Shop now
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* =============================================
         CHAPTER 5 - ACTION
         Take it. Here is exactly how.
      ============================================== */}
      <section className="bg-surface py-20 lg:py-24 border-t border-cloud-300">
        <div className="container max-w-5xl grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
              The Action
            </p>
            <h2
              className="font-serif text-navy-800 text-balance"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              Take it. Here is exactly how.
            </h2>
            <p className="mt-5 text-lg text-ink/75 leading-relaxed">
              Take IP6 Original on an empty stomach, at least 30 minutes before food or two hours after. Always consult your physician before beginning any supplement regimen.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/shop/${supplement.slug}`}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-7 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/faq#how-to-take"
                className="text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-sky-300 decoration-2"
              >
                Full dosing guide →
              </Link>
            </div>
          </div>
          <ol className="divide-y divide-cloud-300 border-y border-cloud-300">
            {[
              { icon: Beaker, t: "On an empty stomach", b: "30 minutes before food, or 2 hours after." },
              { icon: RefreshCw, t: "With water only", b: "8 oz minimum. Avoid mineral-rich beverages within an hour." },
              { icon: AlertTriangle, t: "Consult your physician", b: "Always discuss new supplements with your healthcare professional." },
            ].map((s, i) => (
              <li key={i} className="py-5 flex items-start gap-4">
                <s.icon className="size-5 text-gold-500 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-semibold text-navy-800">{s.t}</p>
                  <p className="text-sm text-ink/65 mt-1 leading-relaxed">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Footer showDshea />
    </>
  );
}

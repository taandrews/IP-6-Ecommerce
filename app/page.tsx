import Image from "next/image";
import { asset } from "@/lib/assets";
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
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { getCatalog } from "@/lib/data/catalog";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";

export default async function HomePage() {
  const currency = resolveCurrency();
  const supplement = (await getCatalog()).find((p) => p.slug === "ip6-original-supplement")!;
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
        {/* Full-bleed photo slideshow: duotone tint, typed headline, reveal. */}
        <HeroSlideshow ctaHref={`/shop/${supplement.slug}`} />

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
              <Truck className="size-3.5 text-sky-700" /> Free US shipping over $75
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-sky-700" /> Made in USA
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
          <p className="text-lg lg:text-xl text-ink/75 leading-relaxed">
            IP6 is{" "}
            <strong className="text-navy-800 font-semibold">inositol hexaphosphate</strong>, a molecule found naturally in seeds, grains, and legumes, where it stores energy and minerals. IP6 Original pairs it with{" "}
            <strong className="text-navy-800 font-semibold">Inositol</strong>, the simpler compound at its core, the way Prof. Shamsuddin&rsquo;s research describes the two. Knowing what the molecule is makes the next question, how pure is it, the one that matters.
          </p>
        </div>
      </section>

      {/* =============================================
         CHAPTER 2 - STRENGTHS
         IP6 Original's own strengths only, no competitor comparison.
      ============================================== */}
      <section className="bg-surface py-20 lg:py-28">
        <div className="container max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
            IP6 Original
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
            The highest purity. Research grade.
          </h2>
          <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-3xl">
            IP6 Original is the formula the scientist who pioneered the research built himself, third-party tested and manufactured in a cGMP-certified facility.
          </p>

          <ul className="mt-12 lg:mt-16 grid sm:grid-cols-2 gap-px bg-cloud-300 border border-cloud-300 rounded-2xl overflow-hidden">
            {[
              "Highest purity, research grade",
              "No magnesium stearate or silicon dioxide",
              "Third-party tested, cGMP-certified manufacturing",
              "Formulated by the scientist who pioneered the research",
            ].map((t) => (
              <li key={t} className="bg-surface p-7 lg:p-8 text-navy-800 leading-relaxed">
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <Link
              href="/the-difference"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 underline underline-offset-4 decoration-sky-300 decoration-2"
            >
              See what goes into it
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-10">
            {[
              { t: "Pioneer in IP6 Research", l: "Built on the founder's body of published work" },
              { t: "Founder & Formulator", l: "Formulated by Prof. Shamsuddin himself" },
              { t: "cGMP Certified", l: "Manufactured in a cGMP-certified facility" },
              { t: "Third-Party Tested", l: "Independently tested for purity, potency, and quality" },
            ].map((c) => (
              <div key={c.t}>
                <span aria-hidden className="block h-px w-12 bg-gold-500 mb-5" />
                <p
                  className="font-serif text-navy-800 leading-snug"
                  style={{
                    fontFamily: "var(--font-display), Georgia, serif",
                    fontSize: "clamp(1.35rem, 2vw, 1.6rem)",
                    letterSpacing: "-0.015em",
                    fontWeight: 400,
                  }}
                >
                  {c.t}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ink/65 font-semibold leading-snug">
                  {c.l}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <Link
              href="/story#founder"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-gold-500 decoration-2"
            >
              Meet Prof. Shamsuddin
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =============================================
         CHAPTER 3 EXIT-RAMP - The Solution (product card link)
      ============================================== */}
      <section className="bg-surface py-20 lg:py-24 border-t border-cloud-300">
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
            One formula, from the scientist who pioneered the research.
          </h2>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Highest purity, research grade, third-party tested, manufactured in a cGMP-certified facility, formulated by the scientist who pioneered the research behind it.
          </p>

          <Link
            href={`/shop/${supplement.slug}`}
            className="mt-10 group block border-y border-cloud-300 hover:border-gold-500 transition-colors max-w-2xl"
          >
            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-square sm:aspect-auto">
                <Image
                  src={asset("products/supplement-240.png")}
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
                  240 capsules · 60 servings · 804 mg IP6 and 196 mg Inositol per serving. cGMP manufactured. Third-party tested.
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
              Take 4 capsules once or twice daily with water, or as directed by your healthcare professional. Always consult your physician before beginning any supplement regimen.
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
              { icon: Beaker, t: "Once or twice daily", b: "Take 4 capsules once or twice daily, or as directed by your healthcare professional." },
              { icon: RefreshCw, t: "With water", b: "Take each serving with water." },
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

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

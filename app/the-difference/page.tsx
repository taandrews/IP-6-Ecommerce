import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "What goes into IP6 Original",
  description:
    "The purity, verification, formulation, and source of IP6 Original, line by line.",
  alternates: hreflangAlternates("/the-difference"),
};

// Every value is label wording, an approved claim, or the founder's public bio.
// `more` points at the page that carries the material behind the line.
const ROWS: { label: string; value: string; detail: string; more?: { href: string; label: string } }[] = [
  {
    label: "Purity",
    value: "Highest purity, research grade",
    detail: "The intact molecule the research describes, not broken-down fragments.",
  },
  {
    label: "Formulation",
    value: "804 mg IP6, 196 mg Inositol",
    detail: "Per 4-capsule serving. Calcium-magnesium inositol hexaphosphate paired with Inositol, in a hypromellose (vegetable) capsule. No magnesium stearate, no silicon dioxide, no unnecessary additives.",
    more: { href: "/shop/ip6-original-supplement", label: "See the ingredients" },
  },
  {
    label: "Verification",
    value: "Third-party tested",
    detail: "Independently tested for purity, potency, and quality. Stated on the label.",
    more: { href: "/shop/ip6-original-supplement", label: "See the label" },
  },
  {
    label: "Manufacturing",
    value: "cGMP-certified facility, made in USA",
    detail: "Manufactured to current Good Manufacturing Practice standards. Stated on the label.",
  },
  {
    label: "Formulated by",
    value: "Prof. AbulKalam M. Shamsuddin, MD, PhD",
    detail: "Physician-scientist and pioneer of published research on inositol hexaphosphate. Founder and formulator of IP6 Original.",
    more: { href: "/story#founder", label: "Meet Prof. Shamsuddin" },
  },
  {
    label: "Sizes",
    value: "60 or 240 capsules",
    detail: "15 or 60 servings of 4 capsules.",
    more: { href: "/shop/ip6-original-supplement", label: "Choose a size" },
  },
];

export default function TheDifferencePage() {
  return (
    <>
      <article className="bg-surface">
        <section className="container max-w-4xl pt-20 pb-12 lg:pt-28 lg:pb-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-6">
            The Difference
          </p>
          <h1
            className="font-serif text-navy-800 text-balance"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 400,
            }}
          >
            What goes into IP6 Original.
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-ink/70 leading-relaxed max-w-2xl">
            The purity, verification, and source of the formula, line by line, with the label or the research behind each line where one exists.
          </p>
        </section>

        {/* Primer - what IP6 is, and why the purity of the compound is the measure of it */}
        <section className="container max-w-3xl pb-10 lg:pb-12">
          <div className="border-l-2 border-gold-500 pl-5 lg:pl-6">
            <p className="text-base lg:text-lg text-ink/75 leading-relaxed">
              First, what it is. IP6, or{" "}
              <strong className="text-navy-800 font-semibold">inositol hexaphosphate</strong>, is a naturally occurring molecule of inositol carrying six phosphate groups, found in the bran of seeds and grains.{" "}
              <strong className="text-navy-800 font-semibold">Inositol</strong> is the simpler compound at its core, and IP6 Original pairs the two as Prof. Shamsuddin&rsquo;s research describes them. Because IP6 is defined by those six phosphate groups, the purity of the compound, how much of it remains the intact molecule rather than broken-down fragments, is what determines its quality. That is why purity comes first below.
            </p>
          </div>
        </section>

        {/* Specification sheet: IP6 Original's own facts only, no competitor column */}
        <section className="container max-w-4xl pb-12 lg:pb-16" aria-labelledby="spec-title">
          <h2
            id="spec-title"
            className="text-navy-800 text-balance"
            style={{ fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
          >
            What is in every bottle.
          </h2>
          <p className="mt-3 mb-8 text-base lg:text-lg text-ink/75 leading-relaxed max-w-2xl">
            Each line below is taken from the label or from the founder&rsquo;s own record. Nothing here is a comparison with anyone else.
          </p>

          <div className="border-t-2 border-navy-800">
            {/* Column headers, desktop only */}
            <div className="hidden sm:grid grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-x-8 py-3 border-b border-navy-100">
              <p className="text-sm font-semibold text-navy-800">Specification</p>
              <p className="text-sm font-semibold text-navy-800">IP6 Original Supplement</p>
            </div>

            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-x-8 gap-y-2 py-6 border-b border-navy-100"
              >
                <p
                  className="text-navy-800"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400, fontSize: "1.25rem", lineHeight: 1.2 }}
                >
                  {row.label}
                </p>
                <div className="sm:border-l-2 sm:border-gold-500 sm:pl-6">
                  <p className="text-[17px] text-navy-800 font-semibold leading-snug">{row.value}</p>
                  <p className="mt-1.5 text-[15px] text-ink/75 leading-relaxed">{row.detail}</p>
                  {row.more ? (
                    <a href={row.more.href} className="mt-2.5 inline-flex items-center gap-1 text-[15px] font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
                      {row.more.label}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing line */}
        <section className="container max-w-3xl py-16 lg:py-24 text-center">
          <p
            className="font-serif text-navy-800 text-balance leading-tight"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            One formula, from the scientist who pioneered the research.
          </p>
          <div className="mt-10">
            <Link
              href="/shop/ip6-original-supplement"
              className="inline-flex items-center gap-2 bg-button hover:bg-button-hover text-surface px-7 py-4 rounded-full font-semibold"
            >
              Shop IP6 Original
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </article>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

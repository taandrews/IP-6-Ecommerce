import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "What goes into IP6 Original",
  description:
    "The purity, verification, formulation, and source of IP6 Original, line by line.",
  alternates: hreflangAlternates("/the-difference"),
};

// `more` points at the material behind each line where it exists: the label itself,
// or the research site. Lines without a public document say so plainly.
const ROWS: { label: string; original: string; more?: { href: string; label: string }; note?: string }[] = [
  { label: "Purity", original: "Highest purity, research grade", note: "Third-party tested for purity, potency, and quality." },
  { label: "Verification", original: "Third-party tested", note: "Stated on the label." , more: { href: "/shop/ip6-original-supplement", label: "See the label" } },
  { label: "Formulation", original: "No magnesium stearate or silicon dioxide", more: { href: "/shop/ip6-original-supplement", label: "See the ingredients" } },
  { label: "Manufacturing", original: "cGMP-certified facility", note: "Stated on the label." },
  { label: "Formulated by", original: "Prof. Shamsuddin, founder & formulator", more: { href: "https://www.ip-6.net/#papers", label: "Read his published research" } },
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

        {/* Specification table: IP6 Original's own strengths only, no competitor column */}
        <section className="container max-w-4xl pb-12">
          <div className="border-y border-cloud-300">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1.6fr] py-5 lg:py-6 border-b border-cloud-300">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/55 font-bold">
                  Specification
                </p>
              </div>
              <div className="border-l-2 border-gold-500 pl-5 lg:pl-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-navy-800 font-bold mb-1">
                  IP6 Original
                </p>
                <p className="text-xs text-ink/65">From the lab of Prof. Shamsuddin</p>
              </div>
            </div>

            {/* Data rows */}
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_1.6fr] py-5 lg:py-6 ${
                  i < ROWS.length - 1 ? "border-b border-cloud-300" : ""
                }`}
              >
                <div className="flex items-center">
                  <p className="font-semibold text-navy-800 text-sm lg:text-base">{row.label}</p>
                </div>
                <div className="border-l-2 border-gold-500 pl-5 lg:pl-6 flex items-start gap-3">
                  <Check className="size-4 text-gold-700 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm lg:text-base text-navy-800 font-medium">{row.original}</p>
                    {row.note ? <p className="mt-1 text-sm text-ink/70">{row.note}</p> : null}
                    {row.more ? (
                      <a href={row.more.href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
                        {row.more.label}
                        <ArrowRight className="size-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Not all IP6 is the same",
  description:
    "Most IP6 on the market has no connection to the research that identified its potential. The specification, verification, and source of IP6 Original, line by line.",
  alternates: hreflangAlternates("/the-difference"),
};

export default function TheDifferencePage() {
  return (
    <>
      <article className="bg-surface">
        <section className="container max-w-4xl pt-20 pb-12 lg:pt-28 lg:pb-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-6">
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
            Not all IP6 is the same.
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-ink/70 leading-relaxed max-w-2xl">
            Most IP6 on the market has no connection to the research that identified its potential. Here is the difference.
          </p>
        </section>

        {/* Primer - what IP6 is, and why the purity of the compound is the measure of it */}
        <section className="container max-w-3xl pb-10 lg:pb-12">
          <div className="border-l-2 border-gold-500 pl-5 lg:pl-6">
            <p className="text-base lg:text-lg text-ink/75 leading-relaxed">
              First, what it is. IP6, or{" "}
              <strong className="text-navy-800 font-semibold">inositol hexaphosphate</strong>, is a naturally occurring molecule of inositol carrying six phosphate groups, found in the bran of seeds and grains.{" "}
              <strong className="text-navy-800 font-semibold">Inositol</strong> is the simpler compound at its core, and IP6 Original pairs the two as Prof. Shamsuddin&rsquo;s research describes them. Because IP6 is defined by those six phosphate groups, the purity of the compound, how much of it remains the intact molecule rather than broken-down fragments, is what determines its quality. That is what the comparison below measures.
            </p>
          </div>
        </section>

        {/* Comparison table (shared with the home page) */}
        <section className="container max-w-5xl pb-12">
          <ComparisonTable />
        </section>

        {/* Closing line */}
        <section className="container max-w-3xl py-16 lg:py-24 text-center">
          <p
            className="font-serif text-navy-800 text-balance leading-tight"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            “If you are going to take IP6 daily, take the version his research describes.”
          </p>
          <div className="mt-10">
            <Link
              href="/shop/ip6-original-supplement"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-7 py-4 rounded-full font-semibold"
            >
              Shop IP6 Original
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </article>

      <Footer showDshea />
    </>
  );
}

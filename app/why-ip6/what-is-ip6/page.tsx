import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "What Is IP6?",
  description:
    "A non-clinical primer on inositol hexaphosphate (IP6): chemistry, sourcing, and why purity is the conversation.",
  alternates: hreflangAlternates("/why-ip6/what-is-ip6"),
};

export default function WhatIsIP6Page() {
  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">Why IP6 / What Is IP6?</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            What is inositol hexaphosphate?
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            A non-clinical primer on the molecule, where it comes from, and why our 95%+ purity specification is the most important number on the label.
          </p>
        </div>
      </section>

      <article className="container py-16 max-w-3xl space-y-10 text-ink/85 leading-relaxed text-lg">
        <section>
          <h2 className="font-sans font-semibold text-navy-800 mb-3" style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)" }}>The molecule</h2>
          <p>Inositol hexaphosphate (IP6) is a naturally occurring compound found in whole grains, legumes, seeds, and nuts. Chemically, it is a single inositol ring bound to six phosphate groups. It serves as the primary storage form of phosphorus in plants.</p>
        </section>
        <section>
          <h2 className="font-sans font-semibold text-navy-800 mb-3" style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)" }}>Where it comes from</h2>
          <p>We source IP6 from rice bran, one of the richest natural reservoirs of the molecule. The extraction process yields a mixture of IP6 and partial phosphate forms (IP5, IP4, IP3). Commodity-grade material ships with 50 to 80 percent intact IP6 and significant carryover of the partial forms.</p>
          <p className="mt-4">Our contract partner isolates the intact hexaphosphate fraction to 95%+ purity. Partial forms are not simply weaker; they interact differently with cations and cannot be treated as a dilute form of the same molecule.</p>
        </section>
        <section>
          <h2 className="font-sans font-semibold text-navy-800 mb-3" style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)" }}>Why purity is the conversation</h2>
          <p>Research protocols typically require 90 to 95%+ pure material to produce consistent, reproducible outcomes. That is the specification we hold every batch of IP6 Original to. It is verified by HPLC, documented on a certificate of analysis, and available on each product page for download.</p>
        </section>
      </article>

      <nav aria-label="Continue" className="container max-w-3xl mb-20 pt-8 border-t border-cloud-300">
        <Link href="/why-ip6/how-it-works" className="group flex items-center justify-between text-navy-800 hover:text-sky-700 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">Next</p>
            <p className="font-sans font-semibold text-lg mt-1">How IP6 Works</p>
          </div>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { asset } from "@/lib/assets";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Why IP6",
  description:
    "Why IP6 Original is held to a research-grade purity specification, third-party tested every batch, and manufactured to cGMP standards.",
  alternates: hreflangAlternates("/why-ip6"),
};

export default function WhyIP6Page() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.category === "supplement")!;
  const from = Math.min(...supplement.variants.map((v) => v.priceCents[currency]));

  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300">
        <div className="container py-16 lg:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <p className="eyebrow">Why IP6</p>
            <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              There&apos;s only one IP6 Original.
            </h1>
            <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-xl">
              IP6 Original is the only consumer supplement standardized to a 95%+ inositol hexaphosphate purity specification, verified by HPLC on every batch.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={`/shop/${supplement.slug}`} className="btn-primary">
                Shop · {formatPrice(from, currency)}
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/why-ip6/how-it-works" className="text-sm font-semibold text-sky-700 hover:text-sky-800 underline underline-offset-4 decoration-sky-300 decoration-2">
                See how it works →
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-card bg-cloud-200">
            <Image src={asset("products/supplement-1.jpg")} alt="IP6 Original Supplement" fill priority sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Numbered key benefits */}
      <section className="container py-20 lg:py-24">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow mb-3">Key benefits</p>
          <h2 className="font-sans font-semibold text-navy-800" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            What sets IP6 Original apart.
          </h2>
        </div>
        <ol className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {[
            { n: 1, t: "Research-grade purity", b: "95%+ intact IP6, verified by HPLC on every batch. Commodity material typically ships at 50–80% intact, with significant carryover of partial forms (IP5, IP4, IP3) that behave differently." },
            { n: 2, t: "cGMP-certified manufacturing", b: "Produced in facilities certified to current Good Manufacturing Practices, the same standard pharmaceutical contract manufacturers operate under." },
            { n: 3, t: "Third-party batch testing", b: "Every batch is independently tested by an ISO 17025-accredited laboratory for purity, potency, heavy metals (Pb, As, Cd, Hg), and microbial contamination." },
            { n: 4, t: "Founded by a research scientist", b: "Developed by Dr. AbulKalam M. Shamsuddin, Professor of Pathology at the University of Maryland School of Medicine, with 200+ peer-reviewed publications on inositol hexaphosphate." },
          ].map((b) => (
            <li key={b.n} className="flex gap-5">
              <span className="shrink-0 size-10 rounded-full bg-sky-50 text-sky-700 grid place-items-center font-sans font-bold text-base">
                {b.n}
              </span>
              <div>
                <h3 className="font-sans font-semibold text-navy-800 text-lg mb-2">{b.t}</h3>
                <p className="text-ink/75 leading-relaxed">{b.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Sub-page links — Ozempic-style "next" cards */}
      <section className="bg-cloud-200 py-20 border-y border-cloud-300">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { href: "/why-ip6/what-is-ip6", t: "What Is IP6?", b: "A non-clinical primer on the molecule, where it comes from, and why purity matters.", img: "products/supplement-2.jpg" },
              { href: "/why-ip6/comparison", t: "Compared to Other Supplements", b: "How IP6 Original&apos;s 95%+ specification compares to commodity-grade inositol hexaphosphate.", img: "products/supplement-3.jpg" },
              { href: "/why-ip6/how-it-works", t: "How IP6 Works", b: "The role IP6 plays in the body and what our formulation is designed to support.", img: "blog/the-science-behind-ip6.jpg" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group bg-surface rounded-lg overflow-hidden border border-cloud-300 hover:border-sky-400 transition-colors flex flex-col">
                <div className="relative aspect-[4/3] bg-cloud-200">
                  <Image src={asset(c.img)} alt="" fill sizes="(min-width:768px) 320px, 100vw" className="object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-sans font-semibold text-navy-800 text-lg mb-2">{c.t}</h3>
                  <p className="text-sm text-ink/70 leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: c.b }} />
                  <span className="mt-4 text-sm font-semibold text-sky-700 group-hover:text-sky-800 inline-flex items-center gap-1">
                    Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="container py-20 lg:py-24 max-w-4xl text-center">
        <h2 className="font-sans font-semibold text-navy-800 text-balance mb-5" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
          Ready to start? Shop IP6 Original.
        </h2>
        <p className="text-ink/70 mb-7 max-w-2xl mx-auto">
          One-time purchase or subscribe and save up to 20%. Cancel anytime.
        </p>
        <Link href={`/shop/${supplement.slug}`} className="btn-primary">
          Shop · from {formatPrice(from, currency)}
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

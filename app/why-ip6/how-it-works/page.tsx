import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "How IP6 Works",
  description:
    "How inositol hexaphosphate is studied to support immune health and healthy cell function. Structure-function language, no disease claims.",
  alternates: hreflangAlternates("/why-ip6/how-it-works"),
};

const STEPS = [
  {
    n: 1,
    title: "Supports healthy cell function",
    body: "IP6 is studied for its role in maintaining the chemistry of healthy cells, including its ability to chelate multivalent cations.",
  },
  {
    n: 2,
    title: "Supports immune health",
    body: "Inositol hexaphosphate is investigated as a contributor to several pathways involved in routine immune function.",
  },
  {
    n: 3,
    title: "Supports mineral balance",
    body: "IP6's affinity for cations is the basis of its role in mineral metabolism in plants and the body.",
  },
];

export default function HowIP6WorksPage() {
  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">Why IP6 / How It Works</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            How IP6 Original works.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            IP6 is studied across three structure-function roles. We use structure-function language because that is what the regulatory frame permits.
          </p>
        </div>
      </section>

      {/* Numbered mechanism — Ozempic-style */}
      <section className="container py-20 lg:py-24 max-w-5xl">
        <h2 className="text-center font-sans font-semibold text-navy-800 mb-14" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
          IP6 is studied in 3 structure-function roles.
        </h2>
        <ol className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <li key={s.n} className="text-center">
              <div className="mx-auto size-20 rounded-full bg-sky-50 grid place-items-center mb-6">
                <span className="font-sans font-bold text-sky-700 text-3xl">{s.n}</span>
              </div>
              <h3 className="font-sans font-semibold text-navy-800 text-xl mb-3">{s.title}</h3>
              <p className="text-ink/75 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Disclaimer block */}
      <section className="bg-cloud-200 py-16 border-y border-cloud-300">
        <div className="container max-w-3xl">
          <h2 className="font-sans font-semibold text-navy-800 mb-4" style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)" }}>
            About the language we use.
          </h2>
          <p className="text-ink/75 leading-relaxed">
            Under DSHEA, supplements in the United States are communicated through structure-function claims. These describe how a nutrient supports healthy biological function rather than treats disease. We hold to that language deliberately, because the long-term credibility of a wellness brand depends on respecting that boundary.
          </p>
        </div>
      </section>

      <nav aria-label="Continue" className="container max-w-3xl my-16 pt-6 border-t border-cloud-300">
        <Link href="/how-to-take" className="group flex items-center justify-between text-navy-800 hover:text-sky-700 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">Next</p>
            <p className="font-sans font-semibold text-lg mt-1">How to Take IP6 Original</p>
          </div>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

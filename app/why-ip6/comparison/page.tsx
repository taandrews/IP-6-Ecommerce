import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "IP6 Original vs Other Inositol Hexaphosphate Supplements",
  description:
    "How IP6 Original's research-grade specification compares to commodity-grade IP6 supplements on purity, testing, and documentation.",
  alternates: hreflangAlternates("/why-ip6/comparison"),
};

const ROWS: { spec: string; us: string; commodity: string; usGood: boolean; commodityGood: boolean }[] = [
  { spec: "Intact IP6 purity", us: "95% or higher", commodity: "50–80% typical", usGood: true, commodityGood: false },
  { spec: "Verification method", us: "HPLC every batch", commodity: "Vendor declaration", usGood: true, commodityGood: false },
  { spec: "Heavy metals tested", us: "USP <232> on every batch", commodity: "Variable", usGood: true, commodityGood: false },
  { spec: "Microbial / allergen panel", us: "Yes, every batch", commodity: "Variable", usGood: true, commodityGood: false },
  { spec: "Certificate of analysis", us: "Public, downloadable", commodity: "On request", usGood: true, commodityGood: false },
  { spec: "Manufacturing", us: "cGMP-certified facility", commodity: "Varies", usGood: true, commodityGood: false },
  { spec: "Founder credentials", us: "Professor of Pathology, UMD; 200+ publications", commodity: "Brand-led", usGood: true, commodityGood: false },
];

export default function ComparisonPage() {
  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">Why IP6 / Comparison</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            IP6 Original vs commodity supplements.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Most IP6 on the market is not standardized. The table below describes how our specification compares to a typical commodity supplement.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="overflow-x-auto rounded-lg border border-cloud-300 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud-300 bg-cloud-100">
                <th className="text-left px-5 py-4 font-semibold text-navy-800 text-xs uppercase tracking-[0.18em] w-1/3">
                  Specification
                </th>
                <th className="text-left px-5 py-4 font-semibold text-navy-800 text-xs uppercase tracking-[0.18em]">
                  IP6 Original
                </th>
                <th className="text-left px-5 py-4 font-semibold text-ink/60 text-xs uppercase tracking-[0.18em]">
                  Commodity Supplement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-300">
              {ROWS.map((r) => (
                <tr key={r.spec}>
                  <td className="px-5 py-4 font-medium text-navy-800">{r.spec}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <Check className="size-4 text-sky-600 shrink-0" />
                      <span className="text-ink/85">{r.us}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <X className="size-4 text-ink/40 shrink-0" />
                      <span className="text-ink/65">{r.commodity}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-xs text-ink/55 max-w-3xl">
          Commodity values are typical industry ranges based on supplier-disclosed certificates of analysis. IP6 Original specifications are documented on a per-batch certificate of analysis available on each product page.
        </p>
      </section>

      <nav aria-label="Continue" className="container max-w-3xl mb-20 pt-6 border-t border-cloud-300">
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

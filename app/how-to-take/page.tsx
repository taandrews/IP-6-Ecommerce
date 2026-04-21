import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Calendar, Pill } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  title: "How to Take IP6",
  description:
    "How to take IP6 Original Supplement: dose, timing, what to take it with. Plus skincare and water filter usage guides.",
  alternates: hreflangAlternates("/how-to-take"),
};

const DOSING_STEPS = [
  { week: "Week 1", dose: "1 capsule daily", note: "On an empty stomach, with 8 oz of water" },
  { week: "Week 2+", dose: "2 capsules daily", note: "Continue between meals; consult your healthcare professional" },
];

export default function HowToTakePage() {
  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">How to Take</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            How to take IP6 Original.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            A simple daily routine. Take it on an empty stomach, away from mineral-rich meals, for the best absorption.
          </p>
        </div>
      </section>

      {/* Dosing schedule */}
      <section className="container py-16 lg:py-20 max-w-5xl">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <div>
            <p className="eyebrow mb-3">Dosing</p>
            <h2 className="font-sans font-semibold text-navy-800 text-balance" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Build up over the first week.
            </h2>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Start at 1 capsule daily for the first week, then move to the standard 2-capsule daily dose. Always discuss any new supplement regimen with your healthcare professional.
            </p>
          </div>
          <ol className="space-y-4">
            {DOSING_STEPS.map((s, i) => (
              <li key={i} className="bg-surface border border-cloud-300 rounded-lg p-6 flex items-start gap-5">
                <div className="shrink-0 size-12 rounded-full bg-sky-50 grid place-items-center">
                  <Pill className="size-5 text-sky-700" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">{s.week}</p>
                  <p className="font-sans font-bold text-navy-800 text-2xl mt-1" style={{ letterSpacing: "-0.02em" }}>
                    {s.dose}
                  </p>
                  <p className="text-sm text-ink/70 mt-2">{s.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Timing icons */}
      <section className="bg-cloud-200 py-16 border-y border-cloud-300">
        <div className="container max-w-5xl">
          <h2 className="font-sans font-semibold text-navy-800 text-balance mb-8" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
            When and how to take it.
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, t: "Time of day", b: "Morning is most common, but any consistent time works as long as the stomach is empty." },
              { icon: Calendar, t: "Frequency", b: "Daily. Subscriptions deliver to your chosen cycle so you don&apos;t lapse." },
              { icon: Pill, t: "With water", b: "8 oz of water minimum. Skip mineral-rich foods within 60 minutes for best absorption." },
            ].map((c) => (
              <div key={c.t} className="bg-surface border border-cloud-300 rounded-lg p-6">
                <c.icon className="size-5 text-sky-600 mb-4" />
                <h3 className="font-sans font-semibold text-navy-800 text-lg mb-2">{c.t}</h3>
                <p className="text-sm text-ink/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.b }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other products */}
      <section className="container py-16 lg:py-20 max-w-5xl">
        <h2 className="font-sans font-semibold text-navy-800 text-balance mb-8" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
          For our other products.
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              href: "/shop/ip6-la-sante-cream",
              t: "IP6 La Santé Cream",
              b: "Apply a thin layer to clean, dry skin up to three times daily. Safe for face, body, and sensitive areas.",
              img: "products/cream-1.jpg",
            },
            {
              href: "/shop/ip6-citrate-water-filter",
              t: "IP6-Citrate Water Filter",
              b: "Rinse the cartridge before first use, seat into the upper reservoir, fill, and let gravity do the rest. Filtered water collects within 60 seconds.",
              img: "products/filter-1.jpg",
            },
          ].map((p) => (
            <Link key={p.href} href={p.href} className="group bg-surface border border-cloud-300 rounded-lg overflow-hidden flex hover:border-sky-400 transition-colors">
              <div className="relative w-32 shrink-0 bg-cloud-200">
                <Image src={asset(p.img)} alt="" fill sizes="128px" className="object-cover" />
              </div>
              <div className="p-5 flex-1">
                <h3 className="font-sans font-semibold text-navy-800 text-lg mb-2">{p.t}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{p.b}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="Continue" className="container max-w-3xl mb-20 pt-6 border-t border-cloud-300">
        <Link href="/savings" className="group flex items-center justify-between text-navy-800 hover:text-sky-700 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">Next</p>
            <p className="font-sans font-semibold text-lg mt-1">Savings & Support</p>
          </div>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

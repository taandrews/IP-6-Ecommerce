import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Utensils, AlertTriangle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "How to take IP6 Original",
  description:
    "Take IP6 Original on an empty stomach, at least 30 minutes before food or two hours after. Always consult your physician before beginning any supplement regimen.",
  alternates: hreflangAlternates("/how-to-take"),
};

export default function HowToTakePage() {
  return (
    <>
      <article>
        {/* Hero */}
        <section className="bg-surface border-b border-cloud-300">
          <div className="container max-w-3xl py-20 lg:py-24">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
              How to Take
            </p>
            <h1
              className="font-serif text-navy-800 text-balance"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                fontWeight: 400,
              }}
            >
              Take it. Here is exactly how.
            </h1>
            <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-2xl">
              Take IP6 Original on an empty stomach, at least 30 minutes before food or two hours after eating. Always consult your physician before beginning any supplement regimen.
            </p>
          </div>
        </section>

        {/* Primer — how IP6 and Inositol work together, framing the dosing that follows */}
        <section className="bg-surface">
          <div className="container max-w-3xl pt-14 lg:pt-16">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-4">
              How IP6 and Inositol work together
            </p>
            <p className="text-base lg:text-lg text-ink/75 leading-relaxed">
              IP6 is{" "}
              <strong className="text-navy-800 font-semibold">inositol</strong> carrying six phosphate groups;{" "}
              <strong className="text-navy-800 font-semibold">Inositol</strong> is the same core molecule without them. IP6 Original includes both — the pairing Prof. Shamsuddin&rsquo;s research is built around. Because IP6 readily binds minerals, taking it on an empty stomach gives the compound the cleanest path to absorption, which is why the timing below matters.
            </p>
          </div>
        </section>

        {/* Three timing principles */}
        <section className="container max-w-5xl py-16 lg:py-20">
          <ol className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                step: "01",
                title: "On an empty stomach",
                body: "30 minutes before food, or 2 hours after. Mineral-rich meals reduce absorption.",
              },
              {
                icon: Utensils,
                step: "02",
                title: "With water only",
                body: "8 oz of water minimum. Skip mineral-rich beverages within an hour of taking.",
              },
              {
                icon: AlertTriangle,
                step: "03",
                title: "Consult your physician",
                body: "Always discuss new supplements with your healthcare professional before beginning.",
              },
            ].map((s) => (
              <li
                key={s.step}
                className="bg-surface border border-cloud-300 rounded-xl p-6 lg:p-7 flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="font-serif text-gold-500"
                    style={{
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontSize: "1.5rem",
                      fontStyle: "italic",
                      fontWeight: 400,
                    }}
                  >
                    {s.step}
                  </span>
                  <s.icon className="size-5 text-sky-700" aria-hidden />
                </div>
                <h3 className="font-semibold text-navy-800 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Detailed protocol — placeholder for Client copy */}
        <section className="bg-surface border-y border-cloud-300">
          <div className="container max-w-3xl py-16 lg:py-20">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-3">
              Dosing protocol
            </p>
            <h2
              className="font-serif text-navy-800 mb-6"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                lineHeight: 1.1,
                fontWeight: 400,
              }}
            >
              Daily dose, pairing, timing.
            </h2>
            <div className="rounded-lg border border-dashed border-cloud-400 bg-surface p-5 text-sm text-ink/65 leading-relaxed">
              <p className="font-semibold text-navy-800 mb-2">
                Additional dosing protocol and pairing guidance to be provided by Client.
              </p>
              <p>
                This section will detail the recommended daily serving, how to scale up from a starter dose, what foods and supplements to take with or apart from IP6 Original, and how long to maintain a routine before evaluating fit. Final language pending Client confirmation.
              </p>
            </div>
          </div>
        </section>

        {/* When not to take */}
        <section className="container max-w-3xl py-16 lg:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-3">
            When not to take it
          </p>
          <h2
            className="font-serif text-navy-800 mb-6"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Cautions and contraindications.
          </h2>
          <div className="rounded-lg border border-dashed border-cloud-400 bg-surface p-5 text-sm text-ink/65 leading-relaxed">
            <p className="font-semibold text-navy-800 mb-2">
              When-not-to-take guidance to be provided by Client.
            </p>
            <p>
              This section will list circumstances in which IP6 Original should not be taken or should be paused, including pregnancy, nursing, certain medications, and existing medical conditions. Final language pending Client confirmation.
            </p>
          </div>
          <p className="mt-8 text-sm text-ink/55 italic">
            Always consult your physician before beginning any supplement regimen, including IP6 Original.
          </p>
        </section>

        {/* Closing CTA */}
        <section className="bg-surface border-t border-cloud-300">
          <div className="container max-w-3xl py-16 lg:py-20 text-center">
            <p
              className="font-serif text-navy-800 text-balance leading-tight mb-3"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 400,
                fontStyle: "italic",
              }}
            >
              Ready when you are.
            </p>
            <span className="inline-block h-px w-12 bg-gold-500 mb-7" aria-hidden />
            <div>
              <Link
                href="/shop/ip6-original-supplement"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-8 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </article>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

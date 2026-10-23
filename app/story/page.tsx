import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";
import { FounderContent } from "@/components/sections/FounderContent";

export const metadata: Metadata = {
  title: "The molecule a scientist spent his career on",
  description:
    "Professor Shamsuddin pioneered IP6 research at the University of Maryland School of Medicine before retiring in 2020. Discover the story behind IP6 Original.",
  alternates: hreflangAlternates("/story"),
};

const SERIF = { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400 } as const;

/* The story runs as one continuous timeline: a year or a short label on the left,
   the passage beside it, and the gaps kept tight so it reads as one account. */
const MOMENTS: { label: string; body: string; emphasis?: boolean }[] = [
  {
    label: "1988",
    emphasis: true,
    body: "A researcher at the University of Maryland School of Medicine publishes his first paper on inositol hexaphosphate, and applies for his first patent on June 30 of the same year. The scientific community largely overlooks it. He does not stop.",
  },
  {
    label: "The years that followed",
    body: "Publication after publication. A growing body of peer-reviewed research. A research foundation to keep the work going. A career spent proving that a molecule found in seeds and grains holds properties the world has not yet paid attention to.",
  },
  {
    label: "2020",
    body: "Professor Shamsuddin retires from the University of Maryland School of Medicine. The research continues.",
  },
  {
    label: "IP6 Original",
    emphasis: true,
    body: "At the end of that work, he formulated IP6 Original himself: IP6 and Inositol, the pairing his research is built around, in a vegetable capsule with nothing else added. It is sold directly, by the scientist who pioneered the research behind it.",
  },
];

export default function StoryPage() {
  return (
    <>
      <article className="bg-surface">
        {/* Title */}
        <section className="container max-w-3xl pt-14 pb-10 lg:pt-20 lg:pb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-5">
            The Story
          </p>
          <h1 className="text-navy-800 text-balance" style={{ ...SERIF, fontSize: "clamp(2.5rem, 5vw, 4.25rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            The molecule a scientist spent his career on.
          </h1>
          <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-2xl">
            A career spent on a single molecule. One supplement, formulated by the physician-scientist who pioneered the research behind it.
          </p>
        </section>

        {/* Timeline */}
        <section className="container max-w-3xl pb-14 lg:pb-20">
          <ol className="border-l-2 border-gold-500/60">
            {MOMENTS.map((m) => (
              <li key={m.label} className="relative pl-8 lg:pl-10 pb-10 last:pb-0">
                <span aria-hidden className="absolute -left-[7px] top-2 size-3 rounded-full bg-gold-500" />
                <p className={m.emphasis ? "text-gold-700 italic mb-2" : "text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-2"} style={m.emphasis ? { ...SERIF, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1 } : undefined}>
                  {m.label}
                </p>
                <p className={m.emphasis ? "text-navy-800 text-balance leading-snug" : "text-lg text-ink/85 leading-relaxed"} style={m.emphasis ? { ...SERIF, fontSize: "clamp(1.35rem, 2.2vw, 1.75rem)" } : undefined}>
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link href="/the-difference" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
              What goes into IP6 Original
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* The supplement */}
        <section className="bg-surface border-y border-cloud-300">
          <div className="container max-w-5xl py-12 lg:py-16 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4">
                The supplement
              </p>
              <p className="text-xl lg:text-2xl text-ink/85 leading-relaxed">
                IP6 Original Supplement: 804 mg IP6 and 196 mg Inositol per 4-capsule serving, in a hypromellose capsule. 60 or 240 capsules.
              </p>
              <Link
                href="/shop/ip6-original-supplement"
                className="mt-8 inline-flex items-center gap-2 bg-button hover:bg-button-hover text-surface px-7 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="relative aspect-[3/4] max-w-xs mx-auto w-full">
              <Image
                src={asset("products/supplement-240.png")}
                alt="IP6 Original Supplement"
                fill
                sizes="(min-width:1024px) 320px, 70vw"
                className="object-contain"
              />
            </div>
          </div>
        </section>
      </article>

      <FounderContent />

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

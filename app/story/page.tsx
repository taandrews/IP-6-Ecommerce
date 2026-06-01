import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  title: "The molecule a scientist spent his career on",
  description:
    "Forty years of research at the University of Maryland School of Medicine. 200+ publications. 6+ US patents. One supplement formulated by the scientist who holds them.",
  alternates: hreflangAlternates("/story"),
};

export default function StoryPage() {
  return (
    <>
      <article className="bg-surface">
        {/* Title page */}
        <section className="container max-w-3xl pt-20 pb-16 lg:pt-32 lg:pb-24">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-6">
            The Story
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
            The molecule a scientist spent his career on.
          </h1>
          <p className="mt-8 text-lg text-ink/65 leading-relaxed max-w-2xl">
            Forty years. 200+ peer-reviewed publications. 6+ US patents. One supplement, formulated by the scientist who holds them.
          </p>
          <div className="mt-12 h-px w-24 bg-gold-500" />
        </section>

        {/* 1985 */}
        <section className="bg-surface border-y border-cloud-300">
          <div className="container max-w-3xl py-20 lg:py-28">
            <div className="flex items-baseline gap-6 mb-8">
              <span
                className="font-serif text-gold-500"
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  lineHeight: 1,
                  fontStyle: "italic",
                }}
              >
                1985
              </span>
              <span className="h-px flex-1 bg-cloud-300" />
            </div>
            <p
              className="font-serif text-navy-800 text-balance leading-snug"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
                fontWeight: 400,
              }}
            >
              A researcher at the University of Maryland School of Medicine publishes his first paper on inositol hexaphosphate. The scientific community largely overlooks it. He does not stop.
            </p>
          </div>
        </section>

        {/* The next forty years */}
        <section className="bg-surface">
          <div className="container max-w-3xl py-20 lg:py-28">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-4">
              The next forty years
            </p>
            <p className="text-xl lg:text-2xl text-ink/85 leading-relaxed">
              Publication after publication. More than 200 peer-reviewed studies. Patents issued in the United States, the European Union, Japan, and Singapore. A research foundation founded in Baltimore to keep the work going. Forty years spent proving that a molecule found in seeds and grains holds properties the world has not yet paid attention to.
            </p>
            <div className="mt-12 grid sm:grid-cols-4 gap-4 max-w-3xl">
              {[
                { n: "200+", l: "Peer-reviewed publications" },
                { n: "6+", l: "Issued US patents" },
                { n: "EU · JP · SG", l: "International patents" },
                { n: "1985–today", l: "Forty years of research" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-gold-500 pl-4 py-1">
                  <p
                    className="font-serif text-navy-800 leading-none"
                    style={{
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontSize: "clamp(1.5rem, 2vw, 1.75rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.n}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/60 font-semibold leading-tight">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The supplement */}
        <section className="bg-surface border-y border-cloud-300">
          <div className="container max-w-5xl py-20 lg:py-28 grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-4">
                The supplement
              </p>
              <p className="text-xl lg:text-2xl text-ink/85 leading-relaxed">
                After four decades, Professor Shamsuddin formulated IP6 Original. Not a commodity product. Not a licensed name. The supplement built to the specification his own research describes, manufactured at 95 percent or greater purity, sold directly by the scientist who holds the patents.
              </p>
              <span className="block h-px w-12 bg-gold-500 mt-8 mb-8" />
              <Link
                href="/shop/ip6-original-supplement"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-7 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="relative aspect-[3/4] max-w-sm mx-auto">
              <Image
                src="/products/supplement-real.png"
                alt="IP6 Original Supplement"
                fill
                sizes="(min-width:1024px) 360px, 80vw"
                className="object-contain"
              />
            </div>
          </div>
        </section>
      </article>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

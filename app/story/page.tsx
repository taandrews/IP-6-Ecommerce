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
    "A career of research at the University of Maryland School of Medicine. One supplement, formulated by the physician-scientist who pioneered the research behind it.",
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
            A career spent on a single molecule. One supplement, formulated by the physician-scientist who pioneered the research behind it.
          </p>
          <div className="mt-12 h-px w-24 bg-gold-500" />
        </section>

        {/* 1998 - the first paper */}
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
                1998
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

        {/* The years that followed */}
        <section className="bg-surface">
          <div className="container max-w-3xl py-20 lg:py-28">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-4">
              The years that followed
            </p>
            <p className="text-xl lg:text-2xl text-ink/85 leading-relaxed">
              Publication after publication. A growing body of peer-reviewed research. A research foundation in Baltimore to keep the work going. A career spent proving that a molecule found in seeds and grains holds properties the world has not yet paid attention to.
            </p>
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
                At the end of that work, Professor Shamsuddin formulated IP6 Original. Not a commodity product. Not a licensed name. A high-purity formula built to the specification his own research describes. Third-party tested, made in a cGMP-certified facility, and sold directly by the scientist who pioneered the research behind it.
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

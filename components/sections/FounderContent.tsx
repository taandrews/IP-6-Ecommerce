import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { asset } from "@/lib/assets";


export function FounderContent() {
  return (
    <article id="founder" className="scroll-mt-24">
      {/* Hero */}
      <section className="container py-16 lg:py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cloud-200 max-w-md mx-auto w-full">
          <Image
            src={asset("founder/shamsuddin.png")}
            alt="Portrait of Professor AbulKalam M. Shamsuddin, MD, PhD."
            fill
            sizes="(min-width:1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-5">
            The Founder
          </p>
          <h2
            className="font-serif text-navy-800 text-balance"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            The scientist behind IP6 Original.
          </h2>
          <p className="mt-5 text-lg text-ink/65 leading-snug">
            Prof. AbulKalam M. Shamsuddin, MD, PhD
          </p>
          <p className="text-base text-ink/65">
            Physician-scientist · Retired from the University of Maryland School of Medicine in 2020 · Founder and formulator, IP6 Original
          </p>
          <p className="mt-6 text-lg text-ink/85 leading-relaxed">
            A physician-scientist and pioneer of published research on inositol hexaphosphate, he researched the molecule at the University of Maryland School of Medicine before retiring from the university in 2020. He formulated IP6 Original to bring the product of that research directly to consumers.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container pb-16 lg:pb-24 max-w-3xl text-center border-t border-cloud-300 pt-12">
        <p
          className="font-serif text-navy-800 text-balance leading-tight"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            fontWeight: 400,
            fontStyle: "italic",
          }}
        >
          “IP6 Original is the supplement built to the specification his own research describes.”
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shop/ip6-original-supplement"
            className="inline-flex items-center gap-2 bg-button hover:bg-button-hover text-surface px-7 py-4 rounded-full font-semibold"
          >
            Shop IP6 Original
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}

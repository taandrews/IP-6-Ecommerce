import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { asset } from "@/lib/assets";


export function FounderContent() {
  return (
    <article id="founder" className="scroll-mt-24">
      {/* Hero */}
      <section className="container py-20 lg:py-28 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
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
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
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
          <p className="text-sm text-ink/55">
            Physician-scientist · University of Maryland School of Medicine · Founder and formulator, IP6 Original
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-surface border-y border-cloud-300">
        <div className="container max-w-3xl py-16 lg:py-20 space-y-8 text-lg text-ink/85 leading-relaxed">
          <p>
            Professor AbulKalam M. Shamsuddin, MD, PhD is a physician-scientist who has spent his career at the University of Maryland School of Medicine researching the health properties of inositol hexaphosphate, and a pioneer of the published research on the molecule. He formulated IP6 Original to bring the product of that research directly to consumers.
          </p>

        </div>
      </section>

      {/* Credential strip */}
      <section className="bg-surface border-b border-cloud-300">
        <div className="container py-16 lg:py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-10 max-w-6xl">
          {[
            { t: "Physician-Scientist", l: "University of Maryland School of Medicine" },
            { t: "Pioneer in IP6 Research", l: "A body of published, peer-reviewed work" },
            { t: "Founder", l: "IP6 Original" },
            { t: "Formulator", l: "Formulated IP6 Original himself" },
          ].map((c) => (
            <div key={c.t}>
              <span aria-hidden className="block h-px w-12 bg-gold-500 mb-5" />
              <p
                className="font-serif text-navy-800 leading-snug"
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontSize: "clamp(1.35rem, 2vw, 1.6rem)",
                  letterSpacing: "-0.015em",
                  fontWeight: 400,
                }}
              >
                {c.t}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ink/65 font-semibold leading-snug">
                {c.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-20 lg:py-24 max-w-3xl text-center">
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
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-surface px-7 py-4 rounded-full font-semibold"
          >
            Shop IP6 Original
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}

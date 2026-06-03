import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileText, BookOpen } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  title: "The scientist behind IP6 Original",
  description:
    "Professor AbulKalam M. Shamsuddin, MD, PhD, physician-scientist at the University of Maryland School of Medicine and a pioneer in inositol hexaphosphate research. Founder of IP-6 Research, Inc., and the formulator of IP6 Original.",
  alternates: hreflangAlternates("/founder"),
};

// Patent and book details to be confirmed by Client. Placeholders below
// so the layout is in place when copy lands.
const PATENTS: { number: string; title: string; jurisdiction: string }[] = [
  { number: "Pending, Client to confirm", title: "Patent title to be provided", jurisdiction: "United States" },
];

const BOOKS: { title: string }[] = [
  { title: "Book title to be provided by Client" },
];

const FOUNDATION_URL = "#"; // Placeholder until IP-6 Research Foundation URL is confirmed.

export default function FounderPage() {
  return (
    <>
      <article>
        {/* Hero */}
        <section className="container py-20 lg:py-28 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cloud-200 max-w-md mx-auto w-full">
            <Image
              src={asset("founder/shamsuddin.png")}
              alt="Portrait of Professor AbulKalam M. Shamsuddin, MD, PhD."
              fill
              priority
              sizes="(min-width:1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-5">
              The Founder
            </p>
            <h1
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
            </h1>
            <p className="mt-5 text-lg text-ink/65 leading-snug">
              Prof. AbulKalam M. Shamsuddin, MD, PhD
            </p>
            <p className="text-sm text-ink/55">
              Physician-scientist · University of Maryland School of Medicine · Founder, IP-6 Research, Inc.
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="bg-surface border-y border-cloud-300">
          <div className="container max-w-3xl py-16 lg:py-20 space-y-8 text-lg text-ink/85 leading-relaxed">
            <p>
              Professor AbulKalam M. Shamsuddin, MD, PhD is a physician-scientist who has spent his career at the University of Maryland School of Medicine researching the health properties of inositol hexaphosphate, and a pioneer of the published research on the molecule. He founded IP-6 Research, Inc. in Baltimore, Maryland to bring the product of that research directly to consumers. IP6 Original is his formulation.
            </p>

            {/* Foundation bridge */}
            <div className="border-l-2 border-gold-500 pl-5 py-2">
              <p>
                Dr. Shamsuddin is also the founding president of the IP-6 Research Foundation, the non-profit that continues to support peer-reviewed investigation into inositol hexaphosphate.
              </p>
              <a
                href={FOUNDATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 underline underline-offset-4 decoration-sky-300 decoration-2"
              >
                Visit the IP-6 Research Foundation
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Credential strip */}
        <section className="bg-surface border-b border-cloud-300">
          <div className="container py-16 lg:py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-10 max-w-6xl">
            {[
              { t: "Physician-Scientist", l: "University of Maryland School of Medicine" },
              { t: "Pioneer in IP6 Research", l: "A body of published, peer-reviewed work" },
              { t: "Founder", l: "IP-6 Research, Inc., Baltimore, MD" },
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

        {/* Patents */}
        <section className="container max-w-4xl py-16 lg:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-3">
            Patents
          </p>
          <h2
            className="font-serif text-navy-800 mb-8"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Issued patents on inositol hexaphosphate.
          </h2>
          <p className="text-sm text-ink/55 mb-8">
            Full patent titles, numbers, and jurisdictions to be confirmed by Client.
          </p>
          <ul className="divide-y divide-cloud-300 border-y border-cloud-300">
            {PATENTS.map((p, i) => (
              <li key={i} className="py-5 flex items-start gap-4">
                <FileText className="size-5 text-gold-500 shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-bold">
                    {p.jurisdiction} · {p.number}
                  </p>
                  <p className="text-base text-navy-800 mt-1">{p.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Books */}
        <section className="bg-surface border-t border-cloud-300">
          <div className="container max-w-4xl py-16 lg:py-20">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-3">
              Books
            </p>
            <h2
              className="font-serif text-navy-800 mb-8"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                lineHeight: 1.1,
                fontWeight: 400,
              }}
            >
              Published books by Prof. Shamsuddin.
            </h2>
            <p className="text-sm text-ink/55 mb-8">
              Final list and ISBNs to be confirmed by Client. Titles only, no excerpts shown on this page.
            </p>
            <ul className="divide-y divide-cloud-300 border-y border-cloud-300">
              {BOOKS.map((b, i) => (
                <li key={i} className="py-5 flex items-start gap-4">
                  <BookOpen className="size-5 text-gold-500 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-base text-navy-800">{b.title}</p>
                </li>
              ))}
            </ul>
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
            <Link
              href="/story"
              className="text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-sky-300 decoration-2"
            >
              Read the full story →
            </Link>
          </div>
        </section>
      </article>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

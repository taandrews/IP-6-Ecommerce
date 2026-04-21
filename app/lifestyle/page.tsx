import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { blogPosts } from "@/content/blog-posts";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lifestyle",
  description:
    "Articles, recipes, and routines for living well with IP-6 Research. Real customer stories and practical guides for daily wellness.",
  alternates: hreflangAlternates("/lifestyle"),
};

export default function LifestylePage() {
  const [feature, ...rest] = blogPosts;

  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">Lifestyle</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            Articles, routines, real stories.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Practical guides for daily wellness, customer stories, and the science behind our products.
          </p>
        </div>
      </section>

      {/* Featured article */}
      {feature ? (
        <section className="container py-16 max-w-6xl">
          <Link href={`/blog/${feature.slug}`} className="group grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div className="relative aspect-[5/3] rounded-lg overflow-hidden bg-cloud-200">
              <Image src={feature.coverImage} alt={feature.coverAlt} fill priority sizes="(min-width:1024px) 720px, 100vw" className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-sky-700 font-semibold mb-3">
                Featured · {feature.category}
              </p>
              <h2 className="font-sans font-semibold text-navy-800 text-balance" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {feature.title}
              </h2>
              <p className="mt-4 text-ink/75 leading-relaxed">{feature.excerpt}</p>
              <p className="mt-5 text-xs text-ink/60">
                {feature.author} · {formatDate(feature.publishedAt)} · {feature.readMinutes} min read
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 group-hover:text-sky-800">
                Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {/* Article grid */}
      <section className="bg-cloud-200 py-16 border-y border-cloud-300">
        <div className="container">
          <h2 className="font-sans font-semibold text-navy-800 mb-8" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
            More from the journal.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {rest.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group bg-surface border border-cloud-300 rounded-lg overflow-hidden hover:border-sky-400 transition-colors flex flex-col">
                <div className="relative aspect-[4/3] bg-cloud-200">
                  <Image src={p.coverImage} alt={p.coverAlt} fill sizes="(min-width:768px) 360px, 100vw" className="object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-sky-700 font-semibold mb-2">{p.category}</p>
                  <h3 className="font-sans font-semibold text-navy-800 text-lg mb-3">{p.title}</h3>
                  <p className="text-sm text-ink/70 leading-relaxed line-clamp-3">{p.excerpt}</p>
                  <p className="mt-4 text-xs text-ink/60">{formatDate(p.publishedAt)} · {p.readMinutes} min</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer stories link */}
      <section className="container py-16 lg:py-20 max-w-4xl text-center">
        <h2 className="font-sans font-semibold text-navy-800 text-balance mb-5" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
          Real customer stories.
        </h2>
        <p className="text-ink/75 mb-7 max-w-2xl mx-auto">
          Voluntarily submitted experiences from people using IP-6 Research products. Individual results vary; not clinical claims.
        </p>
        <Link href="/testimonials" className="btn-primary">
          Read customer stories
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

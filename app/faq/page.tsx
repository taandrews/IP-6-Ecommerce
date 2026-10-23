import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { Accordion } from "@/components/ui/Accordion";
import { faqCategories } from "@/content/faqs";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Frequent questions about IP6 Original: shipping, subscriptions, returns, how to take it, and the company.",
  alternates: hreflangAlternates("/faq"),
};

export default function FaqPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ),
  };

  return (
    <>
      <section className="bg-surface border-b border-cloud-300 py-12 lg:py-16">
        <div className="container max-w-6xl">
          <p className="eyebrow">FAQs</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            Frequent questions.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Shipping, subscriptions and returns first, then how to take IP6 Original and what it is.
          </p>
        </div>
      </section>

      {/* Two columns on wide screens: the category list stays in view on the left while the answers scroll. */}
      <div className="container max-w-6xl py-10 lg:py-14 lg:grid lg:grid-cols-[240px_1fr] lg:gap-14">
        <aside className="mb-8 lg:mb-0">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold mb-3">Topics</p>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-l lg:border-cloud-300">
              {faqCategories.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="inline-block text-sm font-medium px-4 py-2 rounded-full border border-cloud-300 text-navy-800 hover:border-gold-500 hover:text-gold-700 transition-colors lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:-ml-px lg:px-4 lg:py-2 lg:hover:border-gold-500"
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block mt-8 rounded-xl border border-cloud-300 p-5">
              <p className="text-sm text-ink/75 leading-relaxed">Still have a question?</p>
              <Link href="/contact" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-700">
                Contact us
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </nav>
        </aside>

        <article className="space-y-12 max-w-3xl">
          {faqCategories.map((c) => (
            <section key={c.id} id={c.id} className="scroll-mt-28">
              <h2 className="font-sans font-semibold text-navy-800 mb-2" style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}>
                {c.label}
              </h2>
              {c.intro ? (
                <p className="text-sm text-ink/60 mb-4">{c.intro}</p>
              ) : null}
              <Accordion
                items={c.items.map((f, i) => ({
                  id: `${c.id}-${i}`,
                  header: f.q,
                  content: (
                    <>
                      <p>{f.a}</p>
                      {f.more ? (
                        <Link href={f.more.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
                          {f.more.label}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : null}
                    </>
                  ),
                }))}
              />
            </section>
          ))}
        </article>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { Accordion } from "@/components/ui/Accordion";
import { faqCategories } from "@/content/faqs";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Frequent questions about IP6 Original, dosing, subscriptions, shipping, and the company.",
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
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">FAQs</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            Frequent questions.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Common questions about IP6 Original, taking it, subscriptions, and the company.
          </p>
        </div>
      </section>

      {/* Category jump-links */}
      <section className="container py-10 max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold mb-3">Jump to</p>
        <div className="flex flex-wrap gap-2">
          {faqCategories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="text-sm font-medium px-4 py-2 rounded-full border border-cloud-300 text-navy-800 hover:border-sky-500 hover:text-sky-700 transition-colors"
            >
              {c.label}
            </a>
          ))}
        </div>
      </section>

      {/* Categorized accordion */}
      <article className="container pb-16 max-w-4xl space-y-12">
        {faqCategories.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-24">
            <h2 className="font-sans font-semibold text-navy-800 mb-4" style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}>
              {c.label}
            </h2>
            <Accordion
              items={c.items.map((f, i) => ({
                id: `${c.id}-${i}`,
                header: f.q,
                content: <p>{f.a}</p>,
              }))}
            />
          </section>
        ))}
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

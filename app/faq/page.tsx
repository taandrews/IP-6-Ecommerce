import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { globalFaqs } from "@/content/faqs";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to the most common questions about IP-6 Research products, shipping, returns, subscriptions, and compliance.",
  alternates: hreflangAlternates("/faq"),
};

export default function FaqPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: globalFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <section className="container py-16 lg:py-24 max-w-3xl">
        <p className="eyebrow mb-4">Frequently asked</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          Questions and answers.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed mb-10">
          If you don't see what you're looking for,{" "}
          <a href="/contact" className="underline text-forest-700">
            reach out to our team
          </a>
          .
        </p>
        <Accordion
          items={globalFaqs.map((f, i) => ({
            id: `faq-${i}`,
            header: f.q,
            content: <p>{f.a}</p>,
          }))}
        />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Footer />
    </>
  );
}

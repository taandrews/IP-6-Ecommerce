import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Stars } from "@/components/ui/Stars";
import { Badge } from "@/components/ui/Badge";
import { testimonials } from "@/content/testimonials";
import { formatDate } from "@/lib/utils";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Customer-submitted testimonials for IP-6 Research products. Real experiences, not clinical claims.",
  alternates: hreflangAlternates("/testimonials"),
};

export default function TestimonialsPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 max-w-2xl">
        <p className="eyebrow mb-4">Testimonials</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          What our customers actually experience.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed">
          Every testimonial below is customer-submitted and voluntary. We do not present testimonials as clinical claims. For the science behind our products, please see individual product pages.
        </p>
      </section>

      <section className="container pb-20">
        <ul className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="rounded-lg bg-surface border border-ivory-300 p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Stars rating={t.rating} />
                {t.verified ? <Badge variant="forest">Verified buyer</Badge> : null}
              </div>
              <blockquote className="mt-4 text-ink/85 italic leading-relaxed">
                “{t.body}”
              </blockquote>
              <div className="mt-auto pt-6 text-sm flex items-center justify-between">
                <span className="font-medium text-forest-800">{t.authorName}</span>
                <time className="text-ink/60 text-xs">{formatDate(t.submittedAt)}</time>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Footer showDshea />
    </>
  );
}

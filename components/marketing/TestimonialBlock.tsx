import { Stars } from "@/components/ui/Stars";
import type { Testimonial } from "@/content/testimonials";

export function TestimonialBlock({
  testimonials,
  heading = "What customers are saying",
}: {
  testimonials: Testimonial[];
  heading?: string;
}) {
  return (
    <section className="container py-16 lg:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="eyebrow mb-3">Testimonials</p>
        <h2 className="font-display text-display-lg text-forest-800">{heading}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.slice(0, 6).map((t) => (
          <figure
            key={t.id}
            className="rounded-lg bg-surface border border-ivory-300 p-6 flex flex-col"
          >
            <Stars rating={t.rating} size={16} />
            <blockquote className="mt-4 text-ink/85 leading-relaxed italic">
              “{t.body}”
            </blockquote>
            <figcaption className="mt-6 pt-4 border-t border-ivory-300 text-sm">
              <span className="font-medium text-forest-800">{t.authorName}</span>
              {t.location ? <span className="text-ink/60"> · {t.location}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

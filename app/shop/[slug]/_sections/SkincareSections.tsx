import Image from "next/image";
import type { Product } from "@/types";
import { Stars } from "@/components/ui/Stars";
import { testimonials } from "@/content/testimonials";
import { asset } from "@/lib/assets";

export function SkincareSections({ product }: { product: Product }) {
  const skincareReviews = testimonials.filter((t) => t.productSku === "SKN-LSC-BASE");

  return (
    <>
      {/* Before / after, customer-submitted only */}
      <section className="bg-ivory-200 py-20">
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow mb-3">Customer experiences</p>
            <h2 className="font-display text-display-md text-forest-800 mb-4">
              Stories from customers, in their own words.
            </h2>
            <p className="text-ink/75 leading-relaxed">
              The experiences below are voluntarily submitted by customers. We present them as individual experiences, not as clinical claims or guarantees of results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {skincareReviews.slice(0, 3).map((t, i) => (
              <figure
                key={t.id}
                className="rounded-lg bg-surface border border-ivory-300 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-ivory-300">
                  <Image
                    src={
                      [
                        asset("products/cream-3.jpg"),
                        asset("products/cream-1.jpg"),
                        asset("products/cream-2.jpg"),
                      ][i]!
                    }
                    alt={`Customer-submitted photograph of skin care routine ${i + 1}.`}
                    fill
                    sizes="(min-width:768px) 360px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <Stars rating={t.rating} size={14} />
                  <blockquote className="text-sm text-ink/80 italic mt-3 flex-1 leading-relaxed">
                    “{t.body}”
                  </blockquote>
                  <figcaption className="text-sm font-medium text-forest-800 mt-4 pt-3 border-t border-ivory-300">
                    {t.authorName}
                    {t.location ? <span className="text-ink/60"> · {t.location}</span> : null}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <p className="text-xs text-ink/60 text-center mt-8">
            Individual experiences vary. Results are not guaranteed and are not intended as medical claims.
          </p>
        </div>
      </section>

      {/* Cortisone-free positioning */}
      <section className="container py-16 max-w-3xl">
        <p className="eyebrow mb-3">Designed differently</p>
        <h2 className="font-display text-display-md text-forest-800 mb-4">
          A cortisone-free formula, deliberately.
        </h2>
        <p className="text-ink/85 leading-relaxed">
          {product.name} is built without corticosteroids. The formula centers on a ceramide base, shea butter, our IP6 complex, niacinamide, and allantoin, chosen to support skin barrier function without the long-term trade-offs associated with topical steroid use.
        </p>
      </section>
    </>
  );
}

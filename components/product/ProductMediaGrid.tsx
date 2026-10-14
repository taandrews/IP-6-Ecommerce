import Image from "next/image";
import { Check } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Product media as a stacked two-column grid on desktop and a snap-scrolling
 * row on mobile. Photo tiles come from product.images. The claims tile and
 * the Supplement Facts tile are rendered from product data so they always
 * match the current formula, independent of label art.
 */
export function ProductMediaGrid({ product }: { product: Product }) {
  const facts = product.supplementFacts;
  const claims = product.highlights.slice(0, 4);

  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none",
        "lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0",
      )}
      aria-label="Product media"
    >
      {product.images.map((im, i) => {
        const portrait = im.width / im.height < 1;
        return (
          <figure
            key={im.url + i}
            className={cn(
              "relative w-[82vw] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-xl bg-cream-200",
              "aspect-[4/5] lg:w-auto lg:max-w-none",
              i === 0 && "lg:col-span-2 lg:aspect-[4/3]",
            )}
          >
            <Image
              src={im.url}
              alt={im.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 640px, 82vw"
              className={portrait ? "object-contain p-8" : "object-cover"}
            />
          </figure>
        );
      })}

      {/* Claims tile */}
      <div
        className={cn(
          "relative flex w-[82vw] max-w-[420px] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-xl bg-navy-800 p-6 text-surface",
          "aspect-[4/5] lg:w-auto lg:max-w-none lg:aspect-auto lg:min-h-[320px]",
        )}
      >
        <p className="mb-auto text-[10px] uppercase tracking-[0.28em] text-gold-300 font-bold">
          {product.heroClaim}
        </p>
        <ul className="space-y-2.5 text-sm leading-snug">
          {claims.map((c) => (
            <li key={c} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-gold-300" strokeWidth={2.5} aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Supplement Facts tile, rendered from data */}
      {facts ? (
        <div
          className={cn(
            "w-[82vw] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-xl border border-navy-800/15 bg-surface p-5",
            "aspect-[4/5] lg:w-auto lg:max-w-none lg:aspect-auto lg:min-h-[320px]",
          )}
        >
          <div className="border-[3px] border-navy-800 p-3 text-navy-800">
            <p className="text-2xl font-bold leading-none tracking-tight">Supplement Facts</p>
            <p className="mt-2 text-xs">Serving Size {facts.servingSize}</p>
            {facts.servingsPerContainer ? (
              <p className="text-xs">Servings Per Container {facts.servingsPerContainer}</p>
            ) : null}
            <div className="mt-2 flex justify-between border-y-[6px] border-navy-800 py-1 text-[11px] font-bold">
              <span>Amount Per Serving</span>
              <span>%DV</span>
            </div>
            <dl>
              {facts.rows.map((r) => (
                <div
                  key={r.name}
                  className="flex items-baseline justify-between gap-3 border-b border-navy-800/40 py-1.5 text-xs"
                >
                  <dt className="font-medium">{r.name}</dt>
                  <dd className="flex shrink-0 gap-4 tabular-nums">
                    <span className="font-semibold">{r.amount}</span>
                    <span className="w-4 text-right">{r.dailyValue ?? ""}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {facts.footnote ? <p className="mt-2 text-[10px] leading-snug">{facts.footnote}</p> : null}
            {facts.otherIngredients ? (
              <p className="mt-2 border-t-[3px] border-navy-800 pt-2 text-[10px] leading-snug">
                <span className="font-bold">Other ingredients:</span> {facts.otherIngredients}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

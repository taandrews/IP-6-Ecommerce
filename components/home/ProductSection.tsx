"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { Product, Currency } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartStore";

type Mode = "subscribe" | "one-time";

/**
 * Full product section: gallery left (main + thumbnails, macro shots when
 * present), mono spec block, price, subscribe/one-time toggle (subscribe
 * default, 15% placeholder until Recharge), add to cart. A sticky bottom
 * add-to-cart bar appears on mobile once the section has scrolled past.
 */
export function ProductSection({
  product,
  currency,
  macros,
}: {
  product: Product;
  currency: Currency;
  macros: string[];
}) {
  const variant = product.variants.find((v) => v.id === "sup-capsule-120") ?? product.variants[0]!;
  const unit = variant.priceCents[currency];
  const cycle = product.subscriptionCycles[0] ?? { days: 30, discountPct: 15 };
  const [mode, setMode] = useState<Mode>("subscribe");
  const [active, setActive] = useState(0);
  const { add } = useCart();

  const images = [
    ...product.images.map((i) => ({ src: i.url, alt: i.alt, portrait: i.width / i.height < 1 })),
    ...macros.map((m, i) => ({ src: m, alt: `IP6 Original macro shot ${i + 1}`, portrait: false })),
  ];
  const img = images[active] ?? images[0]!;
  const price = mode === "subscribe" ? Math.round(unit * (1 - cycle.discountPct / 100)) : unit;

  const ref = useRef<HTMLElement>(null);
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setPast(!e.isIntersecting && e.boundingClientRect.bottom < 0);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onAdd() {
    add({
      sku: variant.sku,
      variantId: variant.id,
      name: product.name,
      variantLabel: [variant.name, variant.size].filter(Boolean).join(" · "),
      image: product.images[0]?.url ?? "",
      qty: 1,
      unitPriceCents: unit,
      currency,
      subscription: mode === "subscribe" ? { cycleDays: cycle.days, discountPct: cycle.discountPct } : undefined,
    });
  }

  const specs = [
    ["120", "Capsules"],
    ["60", "Servings"],
    ["804 mg", "IP6"],
    ["196 mg", "Inositol"],
    ["cGMP", "Certified"],
    ["Third-party", "Tested"],
  ];

  return (
    <>
      <section ref={ref} className="bg-cream text-navy-800 section-y" aria-labelledby="product-h">
        <div className="container grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-navy-800/10">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 640px, 100vw"
                className={img.portrait ? "object-contain p-10" : "object-cover"}
              />
            </div>
            {images.length > 1 ? (
              <ol className="mt-4 flex gap-3" aria-label="Product images">
                {images.map((im, i) => (
                  <li key={im.src}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === active}
                      className={cn(
                        "relative size-20 overflow-hidden rounded-lg border transition-colors",
                        i === active ? "border-navy-800" : "border-navy-800/15 hover:border-gold-600",
                      )}
                    >
                      <Image src={im.src} alt="" fill loading="lazy" sizes="80px" className={im.portrait ? "object-contain p-2" : "object-cover"} />
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>

          {/* Buy panel */}
          <div className="flex flex-col justify-center">
            <p className="eyebrow mb-5">The Solution</p>
            <h2 id="product-h" className="h-section text-navy-800 text-balance">
              {product.name}
            </h2>
            <p className="body-lg mt-5 font-serif text-navy-800/80">{product.shortDescription}</p>

            <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-navy-800/15 bg-navy-800/15 sm:grid-cols-6">
              {specs.map(([v, l]) => (
                <div key={l} className="bg-cream px-3 py-4">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-navy-800/75">{l}</dt>
                  <dd className="mt-1 font-mono text-[13px] uppercase tracking-[0.06em] text-navy-800">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-serif text-[40px] leading-none tabular-nums">{formatPrice(price, currency)}</span>
              {mode === "subscribe" ? (
                <>
                  <span className="text-navy-800/70 line-through tabular-nums">{formatPrice(unit, currency)}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-gold-700">Save {cycle.discountPct}%</span>
                </>
              ) : null}
            </div>

            <fieldset className="mt-6">
              <legend className="eyebrow mb-3">Purchase</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["subscribe", `Subscribe & save`, `Every ${cycle.days} days · ${cycle.discountPct}% off · cancel anytime`],
                    ["one-time", "One-time purchase", formatPrice(unit, currency)],
                  ] as [Mode, string, string][]
                ).map(([m, t, sub]) => (
                  <label
                    key={m}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                      mode === m ? "border-navy-800 bg-navy-800 text-cream" : "border-navy-800/20 hover:border-navy-800",
                    )}
                  >
                    <input type="radio" name="purchase-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="mt-1 accent-gold-500" />
                    <span>
                      <span className="block font-medium">{t}</span>
                      <span className={cn("block text-xs", mode === m ? "text-cream/80" : "text-navy-800/75")}>{sub}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-navy-800/70">
                Subscribe pricing is a placeholder until Recharge is connected.
              </p>
            </fieldset>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button type="button" onClick={onAdd} className="btn-gold">
                <ShoppingBag className="size-4" />
                Add to cart
              </button>
              <Link href={`/shop/${product.slug}`} className="btn-outline-navy">
                Full details
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky add-to-cart bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-navy-800/10 bg-cream/95 backdrop-blur transition-[transform,visibility] duration-300 lg:hidden",
          past ? "translate-y-0 visible" : "translate-y-full invisible",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
        aria-hidden={!past}
      >
        <div className="container flex h-16 items-center gap-3">
          <p className="min-w-0 flex-1 truncate font-medium text-navy-800">
            {product.name}
            <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.12em] text-navy-800/55">{mode === "subscribe" ? "Subscribe" : "One-time"}</span>
          </p>
          <span className="shrink-0 font-serif text-xl tabular-nums">{formatPrice(price, currency)}</span>
          <button type="button" onClick={onAdd} tabIndex={past ? 0 : -1} className="btn-gold shrink-0 px-5 py-3 text-[12px]">
            Add
          </button>
        </div>
      </div>
    </>
  );
}

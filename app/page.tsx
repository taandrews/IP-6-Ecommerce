import { productHref } from "@/lib/product-links";
import Image from "next/image";
import { asset } from "@/lib/assets";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { TrustTicker } from "@/components/home/TrustTicker";
import { HomeDetails } from "@/components/home/HomeDetails";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { getCatalog } from "@/lib/data/catalog";
import { getPreorderSettings } from "@/lib/data/settings";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { preorderUnitCents } from "@/lib/preorder";
import type { Product } from "@/types";

const SERIF = { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400 } as const;
const H2 = { ...SERIF, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.08, letterSpacing: "-0.02em" } as const;
const EYEBROW = "text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4";
const CTA = "inline-flex items-center gap-2 bg-button hover:bg-button-hover text-surface px-7 py-3.5 rounded-full font-semibold";

/*
  One idea per screen, in the order a first visit reads: the offer (hero),
  the two products with a photo and a button each, four short reasons, the
  scientist in one quote, the molecule in two sentences, how to take it, and
  three practical questions. Every section shares one width and one rhythm.
*/
export default async function HomePage() {
  const currency = resolveCurrency();
  const [catalog, preorder] = await Promise.all([getCatalog(), getPreorderSettings()]);
  const supplement = catalog.find((p) => p.slug === "ip6-original-supplement")!;
  const pet = catalog.find((p) => p.slug === "ip6-original-pet-powder");

  const priceLine = (p: Product) => {
    const v = p.variants[0]!;
    const regular = v.priceCents[currency];
    const now = preorderUnitCents(regular, preorder);
    return { regular, now, size: v.size ?? "" };
  };

  const products: { product: Product; eyebrow: string; title: string; image: string; alt: string }[] = [
    {
      product: supplement,
      eyebrow: "For people",
      title: "IP6 Original Supplement",
      image: asset("products/supplement-240.png"),
      alt: "IP6 Original Supplement, 240 capsules",
    },
    ...(pet
      ? [{
          product: pet,
          eyebrow: "For pets",
          title: "IP6 Original Pet Powder",
          image: asset("products/pet-powder-120g.png"),
          alt: "IP6 Original Pet Powder, 120 g",
        }]
      : []),
  ];

  return (
    <>
      {/* 1. The offer */}
      <section className="relative bg-surface">
        <HeroSlideshow ctaHref={productHref(supplement.slug)} petHref={pet ? productHref(pet.slug) : undefined} />
        <TrustTicker />
      </section>

      {/* 2. Compare both products in one shopping section. */}
      <section id="products" aria-labelledby="products-heading" className="bg-surface py-12 lg:py-16 scroll-mt-24">
        <div className="container max-w-6xl">
          <div className="mb-8 lg:mb-10">
            <p className={EYEBROW}>Find your formula</p>
            <h2 id="products-heading" className="text-navy-800" style={H2}>For people. For pets.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            {products.map(({ product, eyebrow, title, image, alt }) => {
              const price = priceLine(product);
              return (
                <article key={product.slug} aria-labelledby={`${product.slug}-title`} className="flex flex-col min-w-0">
                  <Link href={productHref(product.slug)} className="relative block rounded-xl bg-[#f6f3ed] overflow-hidden" aria-label={`View ${title}`}>
                    <div className="flex justify-between items-center gap-3 px-5 pt-5 sm:px-7">
                      <span className="text-sm font-semibold text-navy-800">{eyebrow}</span>
                      {preorder.active ? <span className="text-xs font-semibold text-gold-700 bg-gold-100 rounded-full px-3 py-1">{preorder.discountPct}% launch offer</span> : null}
                    </div>
                    <div className="relative h-[280px] sm:h-[320px] lg:h-[340px]">
                      <Image src={image} alt={alt} fill sizes="(min-width: 1280px) 524px, (min-width: 768px) 45vw, 90vw" className="object-contain px-8 pt-3 pb-6" />
                    </div>
                  </Link>
                  <div className="flex flex-col flex-1 pt-6">
                    <h3 id={`${product.slug}-title`} className="text-navy-800 text-2xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-base text-ink/75 leading-relaxed md:min-h-[3rem]">
                      {product.category === "pet" ? "Unflavored IP6 and Inositol powder, easy to mix into food for dogs and cats." : "The original IP6 and Inositol formula in vegetable capsules for your daily routine."}
                    </p>
                    <div className="mt-auto pt-5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-2xl font-semibold text-navy-800">{formatPrice(price.now, currency)}</span>
                        {price.now !== price.regular ? <s className="text-sm text-ink/50">{formatPrice(price.regular, currency)}</s> : null}
                        <span className="text-sm text-ink/65 ml-auto">{price.size}</span>
                      </div>
                      <Link href={productHref(product.slug)} className={`${CTA} w-full justify-center mt-5`}>
                        Pre Order Now
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {preorder.active ? <p className="mt-6 text-sm text-ink/65 text-center">{preorder.discountPct}% off for launch. {preorder.shipNote}.</p> : null}
        </div>
      </section>

      <HomeDetails supplement={supplement} pet={pet} preorder={preorder} />

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

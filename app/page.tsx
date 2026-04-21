import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Award, Truck, RefreshCw } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { asset } from "@/lib/assets";

export default function HomePage() {
  const currency = resolveCurrency();

  return (
    <>
      {/* =================== HERO ===================
          Mirrors ozempic.com: sky-blue gradient ground, tiny qualifier line
          on top, MASSIVE typographic brand statement stacked over it,
          red circular callout, teal+red color pair, subscribe-side tab. */}

      {/* Red news/announcement band — pharma-style alert strip */}
      <div className="bg-brandRed-500 text-surface text-center text-xs py-2.5 font-medium">
        <Link href="/why-ip6/comparison" className="underline underline-offset-4 decoration-surface/60 hover:decoration-surface">
          Click here
        </Link>
        <span className="opacity-90"> for information about commodity-grade IP6 supplements on the market.</span>
      </div>

      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #EAF6FA 0%, #D5ECF1 55%, #B9DEE7 100%)",
        }}
      >
        {/* Sticky side "Savings & Support" tab on right edge */}
        <Link
          href="#shop"
          className="hidden lg:flex fixed top-1/2 right-0 -translate-y-1/2 z-30 bg-brandRed-500 hover:bg-brandRed-600 text-surface font-semibold px-3 py-5 rounded-l-lg shadow-card text-[11px] uppercase tracking-[0.18em]"
          style={{ writingMode: "vertical-rl" }}
          aria-label="Savings and support"
        >
          Subscribe & Save
        </Link>

        <div className="container relative pt-6 pb-10 lg:pt-10 lg:pb-16">
          {/* Tiny audience qualifier line, Ozempic-style */}
          <p className="text-[13px] lg:text-sm text-teal-600 font-semibold text-center">
            For adults seeking research-grade wellness
          </p>

          {/* Huge typographic centerpiece */}
          <h1
            className="mt-3 lg:mt-4 font-sans font-black text-teal-600 text-center leading-[0.85] tracking-[-0.045em]"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
          >
            <span className="block text-brandRed-500" style={{ fontSize: "0.42em", letterSpacing: "0.02em" }}>
              THERE&apos;S ONLY ONE
            </span>
            <span className="block mt-1" style={{ fontSize: "1.25em" }}>
              IP
              <span className="text-brandRed-500">·</span>
              6 ORIGINAL
            </span>
            <span className="block mt-3 text-teal-500 font-normal" style={{ fontSize: "0.28em", letterSpacing: "0.05em" }}>
              inositol hexaphosphate · 500mg
            </span>
          </h1>

          {/* Composition row below headline: (left) product image, (center) benefit line, (right) pen/product overlay */}
          <div className="mt-10 lg:mt-14 grid lg:grid-cols-[1fr_1.1fr_1fr] gap-6 lg:gap-10 items-center">
            {/* LEFT — hero lifestyle/product illustration with red "#1" badge */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-square max-w-sm mx-auto">
                <Image
                  src={asset("hero/lifestyle.jpg")}
                  alt="A wellness routine with IP6 Original."
                  fill
                  priority
                  sizes="(min-width:1024px) 420px, 60vw"
                  className="object-cover rounded-full shadow-card"
                />
                {/* Red #1 badge — Ozempic-style callout */}
                <div className="absolute -top-2 -right-2 size-24 lg:size-28 rounded-full bg-brandRed-500 text-surface grid place-items-center text-center shadow-card border-4 border-surface">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em] font-bold opacity-95">
                      Only
                    </p>
                    <p className="font-sans font-black leading-none mt-0.5" style={{ fontSize: "2rem", letterSpacing: "-0.04em" }}>
                      95%+
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.22em] font-bold opacity-95 mt-0.5">
                      pure
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER — headline copy + CTA */}
            <div className="order-1 lg:order-2 text-center">
              <p className="text-base lg:text-lg text-ink/80 leading-relaxed max-w-md mx-auto">
                Your routine is unique. Take the next step with the only inositol hexaphosphate supplement standardized to 95%+ purity and verified by HPLC every batch.
              </p>
              <Link href="#shop" className="btn-primary mt-7 text-base lg:text-lg px-8 py-4">
                See how IP6 could help
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-5 text-[13px] text-ink/60 max-w-sm mx-auto">
                <span className="font-bold text-ink/80">Research-grade.</span> cGMP manufactured. Third-party tested.
              </p>
            </div>

            {/* RIGHT — product hero shot */}
            <div className="relative order-3 hidden lg:block">
              <div className="relative aspect-[3/4] max-w-xs mx-auto">
                <Image
                  src={asset("products/supplement-1.jpg")}
                  alt="IP6 Original Supplement bottle."
                  fill
                  sizes="320px"
                  className="object-contain drop-shadow-xl"
                />
              </div>
              <p className="text-center mt-4 text-xs uppercase tracking-[0.22em] text-teal-600 font-bold">
                60-count · starter
              </p>
            </div>
          </div>
        </div>

        {/* FDA-approved-uses strip bottom of hero, Ozempic-style */}
        <div className="bg-teal-500 text-surface">
          <div className="container py-3 text-center text-sm font-semibold">
            IP6 Original is the only consumer IP6 supplement standardized to a 95%+ purity specification.
            <span className="opacity-80 font-normal"> All claims structure-function only.</span>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-cloud-300 bg-surface">
        <div className="container py-5 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-ink/65 font-semibold">
          <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-sky-600" /> cGMP manufactured</span>
          <span className="flex items-center gap-2"><Award className="size-3.5 text-sky-600" /> ISO 17025 tested</span>
          <span className="flex items-center gap-2"><RefreshCw className="size-3.5 text-sky-600" /> Save up to 20%</span>
          <span className="flex items-center gap-2"><Truck className="size-3.5 text-sky-600" /> Worldwide shipping</span>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="shop" className="container py-20 lg:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <h2 className="font-sans font-semibold text-navy-800" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Shop the products.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => {
            const from = Math.min(...p.variants.map((v) => v.priceCents[currency]));
            const image = p.images[0];
            return (
              <article key={p.sku} className="group rounded-lg overflow-hidden border border-cloud-300 bg-surface hover:shadow-card transition-shadow flex flex-col">
                <Link href={`/shop/${p.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-cloud-200">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 420px, 50vw"
                      className="object-cover transition-transform duration-500 ease-brand group-hover:scale-[1.04]"
                    />
                  ) : null}
                </Link>
                <div className="p-6 flex-1 flex flex-col">
                  <Link href={`/shop/${p.slug}`}>
                    <h3 className="font-sans font-semibold text-navy-800 text-xl hover:text-sky-700 transition-colors">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="mt-1.5 text-sm font-semibold text-sky-700">{p.heroClaim}</p>
                  <p className="mt-3 text-sm text-ink/70 leading-relaxed flex-1">{p.shortDescription}</p>
                  <div className="mt-6 pt-4 border-t border-cloud-300 flex items-end justify-between">
                    <p>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-ink/55 font-semibold block mb-0.5">From</span>
                      <span className="font-sans font-bold text-navy-800 text-lg">
                        {formatPrice(from, currency)}
                      </span>
                    </p>
                    <Link href={`/shop/${p.slug}`} className="btn-primary text-sm px-4 py-2.5">
                      Shop
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

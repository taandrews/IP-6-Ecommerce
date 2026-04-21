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
      {/* HERO — Ozempic-style: text left, lifestyle photo right with floating badge + product overlay */}
      <section className="relative bg-surface overflow-hidden">
        <div className="container pt-12 lg:pt-20 pb-16 lg:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* TEXT */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700 font-bold mb-6">
              The only IP6 you ask for by name
            </p>
            <h1
              className="font-sans font-bold text-navy-800 text-balance"
              style={{
                fontSize: "clamp(3rem, 6vw, 5.75rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.035em",
              }}
            >
              There&apos;s only one <span className="text-sky-700">IP6 Original</span>.
            </h1>
            <p className="mt-7 text-lg lg:text-xl text-ink/75 leading-relaxed max-w-lg">
              Your routine is unique. Take the next step with the only inositol hexaphosphate supplement standardized to 95%+ purity and verified by HPLC every batch.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="#shop" className="btn-primary text-base">
                Shop the products
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/faq" className="text-sm font-semibold text-navy-800 hover:text-sky-700 underline underline-offset-4 decoration-sky-300 decoration-2">
                See how it&apos;s made
              </Link>
            </div>
            <p className="mt-7 text-xs text-ink/55 max-w-md leading-relaxed">
              <span className="font-semibold text-ink/75">Research-grade.</span> 95%+ intact IP6 verified by HPLC every batch. Manufactured in a cGMP facility, tested by an ISO 17025-accredited lab.
            </p>
          </div>

          {/* IMAGE COMPOSITION */}
          <div className="relative">
            {/* Lifestyle photo as primary visual */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-card bg-cloud-200">
              <Image
                src={asset("hero/lifestyle.jpg")}
                alt="A daily wellness routine with IP6 Original Supplement."
                fill
                priority
                sizes="(min-width:1024px) 580px, 100vw"
                className="object-cover"
              />
            </div>

            {/* Floating circular "95%+ pure" badge */}
            <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 size-32 lg:size-40 rounded-full bg-sky-600 text-surface grid place-items-center text-center shadow-card border-4 border-surface">
              <div>
                <p className="font-sans font-bold leading-none" style={{ fontSize: "clamp(1.75rem, 2.6vw, 2.25rem)", letterSpacing: "-0.03em" }}>
                  95%+
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] mt-1 font-semibold opacity-90">
                  IP6 Pure
                </p>
                <div className="h-px w-6 bg-surface/40 mx-auto my-1.5" />
                <p className="text-[8px] uppercase tracking-[0.22em] opacity-75 font-medium">
                  HPLC verified
                </p>
              </div>
            </div>

            {/* Floating product card overlay (bottom-left) */}
            <div className="absolute -bottom-6 -left-4 lg:-bottom-8 lg:-left-8 bg-surface rounded-lg shadow-card border border-cloud-300 p-3 flex items-center gap-3 max-w-[260px]">
              <div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-cloud-100">
                <Image
                  src={asset("products/supplement-1.jpg")}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-semibold">
                  Featured product
                </p>
                <p className="font-sans font-bold text-navy-800 text-sm leading-tight mt-0.5">
                  IP6 Original Supplement
                </p>
                <p className="text-xs text-sky-700 font-semibold mt-0.5">
                  From $49 →
                </p>
              </div>
            </div>
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

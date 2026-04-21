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
      {/* HERO */}
      <section className="bg-cloud-100">
        <div className="container py-16 lg:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
          <div>
            <p className="eyebrow">Pharmaceutical-grade</p>
            <h1
              className="font-sans font-semibold text-navy-800 text-balance mt-4"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              IP6 Original.<br />
              <span className="text-sky-700">95%+ purity, verified.</span>
            </h1>
            <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-lg">
              Inositol hexaphosphate at 95%+ purity, verified by HPLC every batch. Plus a cortisone-free skincare line and a gravity-fed water filter.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="#shop" className="btn-primary">
                Shop the products
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-card bg-cloud-200">
            <Image
              src={asset("products/supplement-1.jpg")}
              alt="IP6 Original Supplement"
              fill
              priority
              sizes="(min-width: 1024px) 540px, 100vw"
              className="object-cover"
            />
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

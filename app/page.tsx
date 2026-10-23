import Image from "next/image";
import { asset } from "@/lib/assets";
import Link from "next/link";
import { ArrowRight, RefreshCw, Beaker, AlertTriangle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { TrustTicker } from "@/components/home/TrustTicker";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { getCatalog } from "@/lib/data/catalog";
import { getPreorderSettings } from "@/lib/data/settings";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { preorderUnitCents } from "@/lib/preorder";

const SERIF = { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 400 } as const;

export default async function HomePage() {
  const currency = resolveCurrency();
  const [catalog, preorder] = await Promise.all([getCatalog(), getPreorderSettings()]);
  const supplement = catalog.find((p) => p.slug === "ip6-original-supplement")!;
  const pet = catalog.find((p) => p.slug === "ip6-original-pet-powder");

  const shopCards = [
    {
      product: supplement,
      eyebrow: "For people",
      title: "IP6 Original Supplement",
      body: "IP6 and Inositol in vegetable capsules. 804 mg IP6 and 196 mg Inositol per 4-capsule serving.",
      image: asset("products/supplement-240.png"),
    },
    pet
      ? {
          product: pet,
          eyebrow: "For pets",
          title: "IP6 Original Pet Powder",
          body: "The same IP6 and Inositol as an unflavored powder for dogs and cats, 804 mg IP6 and 196 mg Inositol per 1 g scoop.",
          image: asset("products/pet-powder-120g.png"),
        }
      : null,
  ].filter(Boolean) as Array<{ product: typeof supplement; eyebrow: string; title: string; body: string; image: string }>;

  return (
    <>
      {/* =============================================
         CHAPTER 1 - HOOK
         Full-bleed photo slideshow with the packaging and one plain sentence.
      ============================================== */}
      <section className="relative bg-surface">
        <HeroSlideshow ctaHref={`/shop/${supplement.slug}`} petHref={pet ? `/shop/${pet.slug}` : undefined} />

        {/* The label's badges, large, as a slow ticker */}
        <TrustTicker />
      </section>

      {/* =============================================
         SHOP - the two products, each size with its price.
         Fixed routes for people and pets, so the rotating hero never has to carry them.
      ============================================== */}
      <section id="shop" className="bg-surface py-16 lg:py-24 scroll-mt-20">
        <div className="container max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4">
            Shop
          </p>
          <h2 className="text-navy-800 text-balance" style={{ ...SERIF, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            One formula. For people, and for pets.
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6 lg:gap-8">
            {shopCards.map(({ product, eyebrow, title, body, image }) => (
              <article key={product.slug} className="group grid grid-cols-[136px_1fr] sm:grid-cols-[180px_1fr] border border-cloud-300 rounded-2xl overflow-hidden hover:border-gold-500 transition-colors bg-surface">
                <Link href={`/shop/${product.slug}`} className="relative bg-cloud-200" aria-label={title}>
                  <Image src={image} alt="" fill sizes="180px" className="object-contain p-3 transition-transform duration-500 ease-brand group-hover:scale-[1.03]" />
                </Link>
                <div className="p-5 sm:p-6 flex flex-col">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-gold-700 font-bold mb-1.5">{eyebrow}</p>
                  <h3 className="text-navy-800 text-xl sm:text-2xl leading-tight" style={SERIF}>
                    <Link href={`/shop/${product.slug}`}>{title}</Link>
                  </h3>
                  <p className="mt-2 text-sm text-ink/75 leading-relaxed">{body}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {product.variants.map((v) => {
                      const regular = v.priceCents[currency];
                      const now = preorderUnitCents(regular, preorder);
                      return (
                        <li key={v.id} className="flex items-baseline justify-between gap-3 border-t border-cloud-300 pt-1.5">
                          <span className="text-navy-800 font-medium">
                            {v.size}
                            {v.servings ? <span className="text-ink/55 font-normal"> · {v.servings} servings</span> : null}
                          </span>
                          <span className="whitespace-nowrap">
                            {now !== regular ? <s className="text-ink/45 mr-1.5">{formatPrice(regular, currency)}</s> : null}
                            <span className="text-navy-800 font-semibold">{formatPrice(now, currency)}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {preorder.active ? (
                    <p className="mt-2 text-xs text-ink/55">{preorder.label} price, {preorder.discountPct}% off. {preorder.shipNote}.</p>
                  ) : null}
                  <Link href={`/shop/${product.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 group-hover:text-gold-700">
                    Shop {eyebrow.toLowerCase()}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
         PRIMER - What IP6 and Inositol are, beside the label that lists them.
      ============================================== */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4">
            First, the molecule
          </p>
          <p className="text-lg lg:text-xl text-ink/80 leading-relaxed max-w-3xl">
            IP6 is{" "}
            <strong className="text-navy-800 font-semibold">inositol hexaphosphate</strong>, a molecule found naturally in seeds, grains, and legumes, where it stores energy and minerals. IP6 Original pairs it with{" "}
            <strong className="text-navy-800 font-semibold">Inositol</strong>, the simpler compound at its core, the way Prof. Shamsuddin&rsquo;s research describes the two. Knowing what the molecule is makes the next question, how pure is it, the one that matters.
          </p>
        </div>
      </section>

      {/* =============================================
         CHAPTER 2 - STRENGTHS, with the man who formulated it.
         One section carries the purity, testing and manufacturing points; they are not repeated below.
      ============================================== */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-6xl grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4">
              IP6 Original
            </p>
            <h2 className="text-navy-800 text-balance" style={{ ...SERIF, fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              The highest purity. Research grade.
            </h2>
            <p className="mt-5 text-lg text-ink/80 leading-relaxed max-w-2xl">
              IP6 Original is the formula the scientist who pioneered the research built himself.
            </p>

            <ul className="mt-10 grid sm:grid-cols-2 gap-px bg-cloud-300 border border-cloud-300 rounded-2xl overflow-hidden">
              {[
                { t: "Highest purity, research grade", d: "The intact molecule the research describes, not broken-down fragments." },
                { t: "Third-party tested", d: "Independently tested for purity, potency, and quality." },
                { t: "cGMP-certified manufacturing", d: "Made in a cGMP-certified facility in the USA." },
                { t: "No magnesium stearate or silicon dioxide", d: "Hypromellose (vegetable) capsules and nothing else." },
              ].map((c) => (
                <li key={c.t} className="bg-surface p-6 lg:p-7">
                  <p className="text-navy-800 text-lg lg:text-xl leading-snug" style={SERIF}>{c.t}</p>
                  <p className="mt-2 text-base text-ink/80 leading-relaxed">{c.d}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/the-difference" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2">
                See what goes into it
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <Link href="/story#founder" className="group block">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cloud-200 border border-cloud-300">
              <Image
                src={asset("founder/shamsuddin.png")}
                alt="Portrait of Professor AbulKalam M. Shamsuddin, MD, PhD."
                fill
                sizes="(min-width:1024px) 400px, 100vw"
                className="object-cover transition-transform duration-500 ease-brand group-hover:scale-[1.02]"
              />
            </div>
            <blockquote className="mt-5 text-navy-800 leading-snug" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)" }}>
              &ldquo;Nature has sprinkled IP6 throughout the planet - in the soil, the seeds, the grains staple to all humanity, and in all our cells for good reasons; let&rsquo;s learn those and enjoy the benefits for centuries to come.&rdquo;
            </blockquote>
            <p className="mt-4 text-navy-800 text-lg" style={SERIF}>Prof. AbulKalam M. Shamsuddin, MD, PhD</p>
            <p className="text-sm text-ink/70 leading-relaxed">Pioneer in IP6 research. Founder and formulator of IP6 Original.</p>
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 group-hover:text-gold-700">
              Meet Prof. Shamsuddin
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* =============================================
         CHAPTER 5 - ACTION
         Take it. Here is exactly how.
      ============================================== */}
      <section className="bg-surface py-16 lg:py-24 border-t border-cloud-300">
        <div className="container max-w-6xl grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold-700 font-bold mb-4">
              The Action
            </p>
            <h2 className="text-navy-800 text-balance" style={{ ...SERIF, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Take it. Here is exactly how.
            </h2>
            <p className="mt-5 text-lg text-ink/80 leading-relaxed">
              Take 4 capsules once or twice daily with water, or as directed by your healthcare professional. Always consult your physician before beginning any supplement regimen.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/shop/${supplement.slug}`}
                className="inline-flex items-center gap-2 bg-button hover:bg-button-hover text-surface px-7 py-4 rounded-full font-semibold"
              >
                Shop IP6 Original
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/how-to-take"
                className="text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2"
              >
                Full dosing guide →
              </Link>
            </div>
          </div>
          <ol className="divide-y divide-cloud-300 border-y border-cloud-300">
            {[
              { icon: Beaker, t: "Once or twice daily", b: "Take 4 capsules once or twice daily, or as directed by your healthcare professional." },
              { icon: RefreshCw, t: "With water", b: "Take each serving with water." },
              { icon: AlertTriangle, t: "Consult your physician", b: "Always discuss new supplements with your healthcare professional." },
            ].map((s, i) => (
              <li key={i} className="py-5 flex items-start gap-4">
                <s.icon className="size-5 text-gold-700 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-semibold text-navy-800">{s.t}</p>
                  <p className="text-base text-ink/80 mt-1 leading-relaxed">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

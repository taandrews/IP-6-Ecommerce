import Image from "next/image";
import { asset } from "@/lib/assets";
import Link from "next/link";
import { ArrowRight, Award, ShieldCheck, FlaskConical, Leaf } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { TrustTicker } from "@/components/home/TrustTicker";
import { MoleculeModel } from "@/components/home/MoleculeModel";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { Accordion } from "@/components/ui/Accordion";
import { faqCategories } from "@/content/faqs";
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
const TEXT_LINK = "inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-700 underline underline-offset-4 decoration-gold-500 decoration-2";

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

  const products: { product: Product; eyebrow: string; title: string; body: string; facts: string[]; image: string; alt: string }[] = [
    {
      product: supplement,
      eyebrow: "For people",
      title: "IP6 Original Supplement",
      body: "IP6 and Inositol in a vegetable capsule, formulated by the scientist who pioneered the research.",
      facts: ["804 mg IP6 and 196 mg Inositol per 4-capsule serving", "Third-party tested, made in a cGMP-certified facility", "No magnesium stearate, no silicon dioxide", "60 or 240 capsules"],
      image: asset("products/supplement-240.png"),
      alt: "IP6 Original Supplement, 240 capsules",
    },
    ...(pet
      ? [{
          product: pet,
          eyebrow: "For pets",
          title: "IP6 Original Pet Powder",
          body: "The same IP6 and Inositol as an unflavored powder for dogs and cats.",
          facts: ["804 mg IP6 and 196 mg Inositol per 1 g scoop", "Unflavored, easy to mix into food", "Measuring scoop included", "120 g tub"],
          image: asset("products/pet-powder-120g.png"),
          alt: "IP6 Original Pet Powder, 120 g",
        }]
      : []),
  ];

  const shippingFaq = faqCategories.find((c) => c.id === "shipping")?.items.slice(0, 2) ?? [];
  const returnsFaq = faqCategories.find((c) => c.id === "returns")?.items.slice(0, 1) ?? [];
  const homeFaq = [...shippingFaq, ...returnsFaq];

  return (
    <>
      {/* 1. The offer */}
      <section className="relative bg-surface">
        <HeroSlideshow ctaHref={`/shop/${supplement.slug}`} petHref={pet ? `/shop/${pet.slug}` : undefined} />
        <TrustTicker />
      </section>

      {/* 2. The products, one at a time */}
      {products.map(({ product, eyebrow, title, body, facts, image, alt }, i) => {
        const price = priceLine(product);
        const flip = i % 2 === 1;
        return (
          <section key={product.slug} className={`bg-surface py-16 lg:py-24 ${i > 0 ? "border-t border-cloud-300" : ""}`}>
            <div className={`container max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/5] max-w-md w-full mx-auto rounded-2xl bg-cloud-200 overflow-hidden" aria-label={title}>
                <Image src={image} alt={alt} fill sizes="(min-width:1024px) 440px, 90vw" className="object-contain p-8" priority={i === 0} />
              </Link>
              <div className="max-w-lg">
                <p className={EYEBROW}>{eyebrow}</p>
                <h2 className="text-navy-800 text-balance" style={H2}>{title}</h2>
                <p className="mt-4 text-lg text-ink/80 leading-relaxed">{body}</p>
                <ul className="mt-6 space-y-2 text-base text-ink/80">
                  {facts.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-2.5 size-1.5 rounded-full bg-gold-500 shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link href={`/shop/${product.slug}`} className={CTA}>
                    {preorder.active ? "Pre-order now" : "Shop now"}
                    <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-base">
                    {price.now !== price.regular ? <s className="text-ink/45 mr-2">{formatPrice(price.regular, currency)}</s> : null}
                    <span className="font-semibold text-navy-800">{formatPrice(price.now, currency)}</span>
                    <span className="text-ink/60"> · {price.size}</span>
                  </p>
                </div>
                {preorder.active ? (
                  <p className="mt-3 text-sm text-ink/60">{preorder.label} price, {preorder.discountPct}% off. {preorder.shipNote}.</p>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}

      {/* 3. Four reasons, one line each */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-6xl">
          <p className={EYEBROW}>The difference is in the details</p>
          <h2 className="text-navy-800 text-balance max-w-2xl" style={H2}>The highest purity. Research grade.</h2>
          <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            {[
              { icon: FlaskConical, t: "Highest purity", d: "The intact molecule the research describes, not broken-down fragments." },
              { icon: ShieldCheck, t: "Third-party tested", d: "Independently tested for purity, potency, and quality." },
              { icon: Award, t: "cGMP certified", d: "Made in a cGMP-certified facility in the USA." },
              { icon: Leaf, t: "Nothing added", d: "No magnesium stearate, no silicon dioxide. A hypromellose capsule and nothing else." },
            ].map((c) => (
              <li key={c.t} className="border-t-2 border-gold-500 pt-5">
                <c.icon className="size-5 text-gold-700" aria-hidden />
                <p className="mt-3 text-navy-800 text-lg" style={SERIF}>{c.t}</p>
                <p className="mt-1.5 text-base text-ink/75 leading-relaxed">{c.d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link href="/the-difference" className={TEXT_LINK}>
              See what goes into it
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. The scientist, in one quote */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-3xl text-center">
          <Link href="/story#founder" className="inline-block" aria-label="Meet Prof. Shamsuddin">
            <span className="relative block size-24 lg:size-28 rounded-full overflow-hidden mx-auto border border-cloud-300">
              <Image src={asset("founder/shamsuddin.png")} alt="" fill sizes="112px" className="object-cover" />
            </span>
          </Link>
          <blockquote className="mt-7 text-navy-800 text-balance leading-snug" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.25rem, 2vw, 1.6rem)" }}>
            &ldquo;Nature has sprinkled IP6 throughout the planet - in the soil, the seeds, the grains staple to all humanity, and in all our cells for good reasons; let&rsquo;s learn those and enjoy the benefits for centuries to come.&rdquo;
          </blockquote>
          <p className="mt-6 text-navy-800 text-base font-semibold">Prof. AbulKalam M. Shamsuddin, MD, PhD</p>
          <p className="text-sm text-ink/65">Pioneer in IP6 research. Founder and formulator of IP6 Original.</p>
          <div className="mt-5">
            <Link href="/story#founder" className={TEXT_LINK}>
              Meet Prof. Shamsuddin
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. The molecule, in two sentences */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-6xl grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-16 items-center">
          <div className="w-full max-w-[220px] mx-auto">
            <MoleculeModel />
          </div>
          <div className="max-w-2xl">
            <p className={EYEBROW}>The molecule</p>
            <h2 className="text-navy-800 text-balance" style={H2}>IP6 and Inositol.</h2>
            <p className="mt-4 text-lg text-ink/80 leading-relaxed">
              IP6 is inositol hexaphosphate, a molecule found naturally in seeds, grains, and legumes. IP6 Original pairs it with Inositol, the simpler compound at its core, the way Prof. Shamsuddin&rsquo;s research describes the two.
            </p>
            <div className="mt-6">
              <Link href="/the-difference" className={TEXT_LINK}>
                Why purity matters
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How to take it */}
      <section className="bg-surface border-t border-cloud-300 py-16 lg:py-24">
        <div className="container max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div>
            <p className={EYEBROW}>How to take it</p>
            <h2 className="text-navy-800 text-balance" style={H2}>Four capsules, once or twice a day.</h2>
            <p className="mt-4 text-lg text-ink/80 leading-relaxed">
              Take 4 capsules once or twice daily with water, or as directed by your healthcare professional. Always consult your physician before beginning any supplement regimen.
            </p>
            <div className="mt-6">
              <Link href="/how-to-take" className={TEXT_LINK}>
                Full directions
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
          <div>
            <p className={EYEBROW}>Good to know</p>
            <Accordion
              items={homeFaq.map((f, i) => ({ id: `home-faq-${i}`, header: f.q, content: <p>{f.a}</p> }))}
            />
            <div className="mt-5">
              <Link href="/faq" className={TEXT_LINK}>
                All questions
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}

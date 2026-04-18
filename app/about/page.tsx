import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about IP-6 Research, Inc. — our formulation philosophy, testing standards, and approach to science-backed wellness.",
  alternates: hreflangAlternates("/about"),
};

export default function AboutPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 max-w-3xl">
        <p className="eyebrow mb-4">About IP-6 Research</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          A wellness company built on the discipline of saying less.
        </h1>
        <p className="text-xl text-ink/75 leading-relaxed">
          IP-6 Research, Inc. develops and manufactures premium supplements, skincare, and filtration products held to institutional research standards. Our thesis is simple: the credibility of a wellness brand lives in what it chooses not to say.
        </p>
      </section>

      <section className="bg-ivory-200">
        <div className="container py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-display-lg text-forest-800 mb-6">
              Why we formulate the way we do.
            </h2>
            <p className="text-ink/80 leading-relaxed mb-4">
              Every product we make starts from a research-grade specification, not a marketing brief. That order matters. When you start from the science, the ingredient list is shorter, the purity is higher, and the claims you can truthfully make are narrower — which is exactly why customers who care about substance find their way to us.
            </p>
            <p className="text-ink/80 leading-relaxed">
              We don't have the largest catalog in wellness. We have three products. Each one was worth making, and each one is held to the same standard.
            </p>
          </div>
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
            <Image
              src={asset("hero/about.jpg")}
              alt="Laboratory instruments and notebooks arranged on a wooden surface."
              fill
              sizes="(min-width:1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container py-20 max-w-3xl">
        <h2 className="font-display text-display-lg text-forest-800 mb-8">Standards we hold.</h2>
        <dl className="space-y-8">
          {[
            {
              t: "cGMP manufacturing",
              d: "Every product is manufactured in facilities certified to current Good Manufacturing Practices — the same standard pharmaceutical contract manufacturers operate under.",
            },
            {
              t: "Third-party batch testing",
              d: "Every batch is independently tested for purity, potency, and heavy-metal contamination by an ISO-accredited laboratory. Certificates of analysis are available on request.",
            },
            {
              t: "Structure-function language",
              d: "We describe what our products do using structure-function claim wording — 'supports,' 'formulated for,' 'designed to.' We will never claim that a product treats, cures, prevents, or heals any medical condition.",
            },
            {
              t: "Regulatory humility",
              d: "Our supplement and skincare pages display the DSHEA disclaimer. Our water filter uses device performance claims grounded in accredited lab testing.",
            },
          ].map((item) => (
            <div key={item.t}>
              <dt className="font-display text-xl text-forest-800 mb-2">{item.t}</dt>
              <dd className="text-ink/80 leading-relaxed">{item.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-forest-800 text-ivory-100 py-20">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-display-lg mb-6">Meet the founder.</h2>
          <p className="text-ivory-100/85 leading-relaxed mb-8">
            IP-6 Research was built around a conviction that serious wellness deserves serious standards. Our founder shaped that conviction into a company.
          </p>
          <Link href="/founder" className="btn-gold">Read the founder's story</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

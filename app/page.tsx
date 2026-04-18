import Image from "next/image";
import Link from "next/link";
import { FlaskConical, Leaf, ShieldCheck, Droplets } from "lucide-react";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { TestimonialBlock } from "@/components/marketing/TestimonialBlock";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { products } from "@/content/products";
import { testimonials } from "@/content/testimonials";
import { resolveCurrency } from "@/lib/currency";

export default function HomePage() {
  const currency = resolveCurrency();

  return (
    <>
      <Hero
        eyebrow="IP-6 Research, Inc."
        title="Wellness, measured."
        description="A quietly serious wellness brand built on institutional research standards. Our supplements, skincare, and filtration systems are formulated with restraint — and tested without exception."
        primaryCta={{ href: "/shop", label: "Explore the collection" }}
        secondaryCta={{ href: "/about", label: "Our philosophy" }}
        image="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=1600&auto=format&fit=crop"
        imageAlt="Soft natural light on a studio arrangement of IP-6 Research products."
      />

      {/* Products */}
      <section aria-labelledby="collection-heading" className="container py-16 lg:py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">The collection</p>
            <h2 id="collection-heading" className="font-display text-display-lg text-forest-800">
              Three products. Each held to the same standard.
            </h2>
          </div>
          <Link href="/shop" className="btn-secondary">View all</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.sku} product={p} currency={currency} />
          ))}
        </div>
      </section>

      <FeatureGrid
        eyebrow="Why IP-6 Research"
        heading="What institutional standards actually mean."
        features={[
          {
            icon: FlaskConical,
            title: "95%+ purity IP6",
            body: "Our supplements are standardized to institutional research specifications. Every batch is third-party tested for purity, potency, and heavy metals.",
          },
          {
            icon: ShieldCheck,
            title: "Cortisone-free formulation",
            body: "La Santé Cream is built for sensitive skin without corticosteroids. Formulated for skin affected by eczema, environmental stress, and chronic sensitivity.",
          },
          {
            icon: Droplets,
            title: "Engineered filtration",
            body: "The IP6-Citrate filter removes lead and arsenic in under 60 seconds of contact time. Gravity-fed. No electricity. No plumbing.",
          },
          {
            icon: Leaf,
            title: "Quiet about claims",
            body: "We use structure-function language, not hype. What we won't say in marketing is part of what you're buying.",
          },
        ]}
      />

      {/* Science strip */}
      <section className="bg-forest-800 text-ivory-100 py-20">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow text-gold-300 mb-4">The science</p>
            <h2 className="font-display text-display-lg mb-6">
              Restraint in claims. Rigor in formulation.
            </h2>
            <p className="text-ivory-100/85 leading-relaxed mb-8">
              We believe the credibility of a wellness brand lives or dies by what it chooses not to say. Every ingredient is chosen for a specific, measurable role. Every batch is tested by an independent, ISO-accredited laboratory. And every claim on this site uses structure-function language — no shortcuts, no promises we can't stand behind.
            </p>
            <Link href="/about" className="btn-gold">Read our approach</Link>
          </div>
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1600&auto=format&fit=crop"
              alt="A researcher examines a sample under soft laboratory lighting."
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <TestimonialBlock testimonials={testimonials} />

      {/* Newsletter */}
      <section className="container py-20">
        <div className="max-w-2xl mx-auto text-center bg-ivory-200 rounded-xl p-10">
          <p className="eyebrow mb-3">Stay in touch</p>
          <h2 className="font-display text-display-md text-forest-800 mb-4">
            Quiet updates. No noise.
          </h2>
          <p className="text-ink/75 mb-6">
            A monthly note on formulation, testing, and the research behind our products. Unsubscribe anytime.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <label htmlFor="home-newsletter" className="sr-only">Email address</label>
            <input
              id="home-newsletter"
              type="email"
              required
              placeholder="you@example.com"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

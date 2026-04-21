import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Grain } from "@/components/ui/Grain";
import { IP6Molecule } from "./IP6Molecule";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "The Science",
  description:
    "A non-clinical introduction to inositol hexaphosphate (IP6). Chemistry, sourcing, the 95%+ purity specification, and how structure-function language shapes our claims.",
  alternates: hreflangAlternates("/science"),
};

export default function SciencePage() {
  return (
    <>
      <section className="relative bg-atmosphere-deep overflow-hidden">
        <Grain intensity="medium" blend="multiply" />
        <div className="container relative py-20 lg:py-32 max-w-5xl">
          <p className="eyebrow mb-6">The Science</p>
          <h1
            className="font-display text-forest-800 text-balance"
            style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)", lineHeight: 0.98, letterSpacing: "-0.035em", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            A molecule, <span className="italic text-forest-700" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 90' }}>patiently studied.</span>
          </h1>
          <p className="mt-10 text-xl text-ink/75 leading-relaxed max-w-2xl">
            Inositol hexaphosphate is one of the most thoroughly investigated compounds in the inositol family. This page is a non-clinical primer on what it is, where it comes from, and why we hold every batch to a 95%+ purity specification.
          </p>
        </div>
      </section>

      {/* Interactive molecule */}
      <section className="relative bg-surface py-24 overflow-hidden">
        <Grain intensity="subtle" blend="multiply" />
        <div className="container grid lg:grid-cols-[1fr_1fr] gap-16 items-center max-w-6xl relative">
          <div>
            <p className="eyebrow mb-4">The structure</p>
            <h2 className="font-display text-display-lg text-forest-800 text-balance">
              One inositol ring. <span className="italic">Six phosphate groups.</span>
            </h2>
            <span className="hairline-gold-left bg-gold-400 mt-6 mb-6" />
            <p className="text-ink/80 leading-relaxed text-lg">
              IP6 is a single inositol ring bound to six phosphate groups. In nature, it is the primary storage form of phosphorus in plants, found in whole grains, legumes, seeds, and nuts. It chelates multivalent cations with high affinity, which is the foundation of nearly every biological role it has been studied for.
            </p>
            <p className="text-ink/70 mt-5 leading-relaxed">
              Hover over each phosphate group to the right. Our research-grade specification requires that 95%+ of the molecules in a batch have all six phosphates intact. Partial forms (IP5, IP4, IP3) exist in commodity material and behave differently.
            </p>
          </div>
          <IP6Molecule />
        </div>
      </section>

      {/* Sourcing */}
      <section className="relative bg-ivory-200 py-24 overflow-hidden">
        <Grain intensity="medium" blend="overlay" />
        <div className="container max-w-5xl grid lg:grid-cols-[1fr_1.4fr] gap-14 relative">
          <div>
            <p className="eyebrow mb-4">Sourcing</p>
            <h2 className="font-display text-display-md text-forest-800 text-balance">
              From rice bran to <span className="italic">research-grade.</span>
            </h2>
          </div>
          <div className="space-y-6 text-ink/85 leading-relaxed text-lg">
            <p>
              We source IP6 from rice bran, one of the richest natural reservoirs of the molecule. The extraction process yields a mixture of IP6 and partial phosphate forms (IP5, IP4, IP3). Commodity-grade material ships with 50 to 80 percent intact IP6 and significant carryover of the partial forms.
            </p>
            <p>
              Our contract partner isolates the intact hexaphosphate fraction to 95%+ purity, verified by HPLC on every batch. The partial forms are not simply weaker; they interact differently with cations and cannot be treated as a dilute form of the same molecule.
            </p>
          </div>
        </div>
      </section>

      {/* Specification ladder */}
      <section className="relative bg-forest-800 text-ivory-100 py-24 overflow-hidden">
        <Grain intensity="heavy" blend="screen" />
        <div className="container max-w-5xl relative">
          <p className="eyebrow text-gold-300 mb-4">The specification</p>
          <h2 className="font-display text-display-lg mb-12 text-balance">
            What &ldquo;research-grade&rdquo; actually means.
          </h2>
          <ol className="space-y-10">
            {[
              {
                step: "01",
                title: "Raw extract assayed on arrival",
                body: "Each shipment is tested by HPLC for total phosphate content and the ratio of IP6 to IP5 / IP4 / IP3.",
              },
              {
                step: "02",
                title: "Isolation to 95%+",
                body: "The intact hexaphosphate fraction is isolated and concentrated. Partial forms are separated out and not reintroduced.",
              },
              {
                step: "03",
                title: "Heavy metal screen",
                body: "Lead, arsenic, cadmium, mercury. All four are screened per batch against USP <232> limits.",
              },
              {
                step: "04",
                title: "Microbial and allergen screen",
                body: "Total plate count, yeast, mold, E. coli, Salmonella. Plus gluten, soy, tree nut, dairy exclusion panels.",
              },
              {
                step: "05",
                title: "Certificate of analysis",
                body: "Issued by an ISO 17025-accredited laboratory. Batch ID, specification, measured value, and pass/fail for every assay.",
              },
            ].map((s) => (
              <li key={s.step} className="grid grid-cols-[auto_1fr] gap-6 items-start">
                <span
                  className="font-display italic text-gold-300"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontVariationSettings: '"opsz" 144, "SOFT" 90' }}
                >
                  {s.step}
                </span>
                <div>
                  <h3 className="font-display text-2xl mb-2" style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30' }}>
                    {s.title}
                  </h3>
                  <p className="text-ivory-100/80 leading-relaxed text-lg max-w-2xl">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Language policy */}
      <section className="container py-24 max-w-3xl">
        <p className="eyebrow mb-4">Claims</p>
        <h2 className="font-display text-display-md text-forest-800 mb-8 text-balance">
          Why we don&apos;t say more than we do.
        </h2>
        <div className="space-y-6 text-ink/85 leading-relaxed text-lg">
          <p>
            Under DSHEA, dietary supplements in the United States are communicated through structure-function claims. These are statements that describe how a nutrient supports healthy biological function. They are narrower than treatment claims, and they are the only claims the regulator permits.
          </p>
          <p>
            We hold to that language deliberately. When you see &ldquo;supports immune health,&rdquo; &ldquo;supports healthy cell function,&rdquo; or &ldquo;formulated for skin affected by eczema&rdquo; on this site, that is the full scope of what we are saying. We do not describe our products as treating, curing, preventing, or healing any condition, because we believe the long-term credibility of a wellness brand depends on respecting that boundary.
          </p>
          <p>
            If you are looking for deeper technical literature, a good first stop is PubMed. Our founder has authored over 200 publications on inositol hexaphosphate and related compounds; those records are available in the public scientific databases under his name.
          </p>
        </div>
        <div className="mt-12 flex gap-4 flex-wrap">
          <Link href="/shop/ip6-original-supplement" className="btn-primary">
            View IP6 Original Supplement
          </Link>
          <Link href="/founder" className="btn-secondary">
            About the founder
          </Link>
        </div>
      </section>

      <Footer showDshea />
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComparisonTable } from "@/components/sections/ComparisonTable";

/** The stakes: navy band, 48px headline, comparison table with gold marks and rules. */
export function Stakes() {
  return (
    <section className="bg-navy-800 text-cream section-y" aria-labelledby="stakes-h">
      <div className="container max-w-5xl">
        <p className="eyebrow-light mb-5">The Stakes</p>
        <h2 id="stakes-h" className="h-section text-cream text-balance max-w-3xl">
          Most IP6 on shelves is not the molecule his research described.
        </h2>
        <p className="body-lg mt-6 max-w-3xl font-serif text-cream/80">
          Most IP6 sold today is a commodity ingredient with no connection to the original research. IP6 Original is the formula the scientist who pioneered that research built himself: a high-purity formula, third-party tested, manufactured in a cGMP-certified facility.
        </p>
        <ComparisonTable variant="dark" className="mt-12 lg:mt-16" />
        <div className="mt-10">
          <Link
            href="/the-difference"
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400 underline decoration-gold-500/60 underline-offset-4 hover:text-cream"
          >
            See the full comparison
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "The Founder",
  description:
    "The founder's story behind IP-6 Research, Inc. — a research-driven approach to wellness, without the theatrics.",
  alternates: hreflangAlternates("/founder"),
};

export default function FounderPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop"
            alt="Portrait of the founder in natural light."
            fill
            priority
            sizes="(min-width:1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="eyebrow mb-4">The Founder</p>
          <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
            A practitioner's view of wellness.
          </h1>
          <p className="text-lg text-ink/75 leading-relaxed">
            IP-6 Research, Inc. grew out of decades of hands-on experience in clinical research and product formulation. Our founder has dedicated their career to the question of how rigorous science becomes trustworthy, accessible consumer products — without the hype.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl space-y-8 text-ink/85 leading-relaxed">
        <p>
          The wellness industry rewards confident claims. Bold promises, compelling stories, clean-looking labels. For a long time, our founder worked adjacent to that industry — in research contexts where those same claims would never survive peer review.
        </p>
        <p>
          The question that shaped IP-6 Research was simple: what would a wellness company look like if it applied the communication standards of academic science to a retail product line? Fewer claims. Narrower language. More testing. More disclosure. A willingness to say: <em>we don't know yet, and until we do, we won't say we do.</em>
        </p>
        <p>
          That discipline shaped every product we ship. The supplement is standardized to a research-grade purity specification. The skincare line is built without cortisone because we believe long-term use of a compound that thins the skin is the wrong trade-off, even when it gives a faster short-term result. The water filter is engineered without electricity because the communities who most need it can't rely on a power grid.
        </p>
        <p>
          None of this is marketing. It's the product of asking, at every decision point, what would hold up in front of a reviewer.
        </p>
      </section>

      <section className="bg-ivory-200 py-16">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-display-md text-forest-800 mb-6">
            Featured product
          </h2>
          <p className="text-ink/75 leading-relaxed mb-8">
            Our founder personally oversaw the formulation of IP6 Original Supplement. The 95%+ purity specification, the capsule design, the cGMP partner — every decision runs back through a research lens.
          </p>
          <Link href="/shop/ip6-original-supplement" className="btn-primary">
            View IP6 Original Supplement
          </Link>
        </div>
      </section>

      <Footer showDshea />
    </>
  );
}

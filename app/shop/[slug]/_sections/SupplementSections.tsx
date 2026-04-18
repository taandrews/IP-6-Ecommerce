import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/assets";

export function SupplementSections() {
  return (
    <>
      {/* Founder endorsement, compliant structure-function language only */}
      <section className="bg-ivory-200 py-20">
        <div className="container max-w-4xl grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div className="relative aspect-square rounded-full overflow-hidden mx-auto w-48 lg:w-full">
            <Image
              src={asset("founder/shamsuddin.png")}
              alt="Portrait of Dr. AbulKalam M. Shamsuddin, founder of IP-6 Research."
              fill
              sizes="(min-width:1024px) 360px, 192px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">From the founder</p>
            <h2 className="font-display text-display-md text-forest-800 mb-5">
              Why we stake the company on 95%+ purity.
            </h2>
            <blockquote className="text-ink/85 leading-relaxed italic border-l-4 border-gold-400 pl-5">
              “We could have shipped an IP6 supplement years earlier if we'd been willing to ship commodity-purity material. We weren't, and we still aren't. The 95%+ specification is the difference between consumer-grade and research-grade — and our customers can feel the difference.”
            </blockquote>
            <p className="mt-6 text-sm text-ink/70">
              — IP-6 Research, Inc. founder. Read more on the{" "}
              <Link href="/founder" className="underline text-forest-700">
                founder's page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Science strip */}
      <section className="container py-16 max-w-3xl">
        <p className="eyebrow mb-3">The science, stated plainly</p>
        <h2 className="font-display text-display-md text-forest-800 mb-4">
          What our formulation is designed to support.
        </h2>
        <p className="text-ink/85 leading-relaxed">
          IP6 Original Supplement is formulated to support immune health and healthy cell function. We use structure-function language because that is the language that survives scientific and regulatory review.
        </p>
      </section>
    </>
  );
}

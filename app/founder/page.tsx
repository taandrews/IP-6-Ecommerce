import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  title: "The Founder",
  description:
    "Dr. AbulKalam M. Shamsuddin, Professor of Pathology at the University of Maryland School of Medicine and founder of IP-6 Research, Inc.",
  alternates: hreflangAlternates("/founder"),
};

export default function FounderPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-ivory-200">
          <Image
            src={asset("founder/shamsuddin.png")}
            alt="Portrait of Dr. AbulKalam M. Shamsuddin, Professor of Pathology at the University of Maryland School of Medicine."
            fill
            priority
            sizes="(min-width:1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="eyebrow mb-4">The Founder</p>
          <h1 className="font-display text-display-xl text-forest-800 mb-4 text-balance">
            Dr. AbulKalam M. Shamsuddin
          </h1>
          <p className="text-sm text-ink/60 mb-6 uppercase tracking-[0.2em]">
            M.B., B.S., PhD · Professor of Pathology · Founder
          </p>
          <p className="text-lg text-ink/75 leading-relaxed">
            Professor Shamsuddin has spent his academic career at the University of Maryland School of Medicine in Baltimore, where several decades of peer-reviewed investigation into inositol hexaphosphate (IP6) and inositol form the scientific foundation of IP-6 Research, Inc.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl space-y-8 text-ink/85 leading-relaxed">
        <p>
          Prof. Shamsuddin graduated from the University of Dhaka (Dhaka Medical College). Following an internship in Massachusetts and residency training in pathology in Maryland, he was certified by the American Board of Pathology in 1977 and joined the faculty of the University of Maryland School of Medicine as an Instructor the same year. He received his PhD from the University of Maryland in 1980 and rose through the ranks of Assistant Professor and Associate Professor to become a full Professor in 1988.
        </p>
        <p>
          For excellence in teaching, Professor Shamsuddin received the Best Teacher award from the medical students on multiple occasions, including the Golden Apple Award from the American Medical Students&apos; Association in 1999.
        </p>
        <p>
          Beginning in the mid-1980s, Prof. Shamsuddin initiated a program of research into inositol hexaphosphate and inositol, natural constituents of cereals and legumes such as rice, corn, and beans. Over the following decades, his laboratory contributed extensively to the peer-reviewed literature characterizing these compounds. He was instrumental in organizing the First International Symposium of IP6 and Other Rice Components in Kyoto, Japan, in June 1998. He has authored over 200 scientific publications and contributed numerous book chapters across his career.
        </p>
        <p>
          A veteran of the Bangladesh Liberation War, Prof. Shamsuddin is the founding President of the IP-6 Foundation, Inc. in Baltimore and the Komolpur Janakallyan Trust in Dhaka, Bangladesh. Both are non-profit organizations supporting health care and economic empowerment in rural Bangladesh.
        </p>
        <p>
          IP-6 Research, Inc. is the commercial extension of that body of work: consumer products formulated to the research-grade purity standards Prof. Shamsuddin has held his own laboratory to for most of his career.
        </p>
      </section>

      <section className="bg-ivory-200 py-16">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-display-md text-forest-800 mb-6">
            Featured product
          </h2>
          <p className="text-ink/75 leading-relaxed mb-8">
            Prof. Shamsuddin personally oversaw the formulation of IP6 Original Supplement. The 95%+ purity specification, the capsule design, and the cGMP manufacturing partner were chosen to the same standards his laboratory held.
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

import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Where we ship",
  description: "IP6 Original currently ships to US addresses only.",
  alternates: hreflangAlternates("/international-shipping"),
};

export default function InternationalShippingPage() {
  return (
    <>
      <section className="container py-16 max-w-3xl">
        <p className="eyebrow mb-4">Shipping</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6">
          Where we ship.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed mb-4">
          We currently ship to US addresses only: the 50 states and Washington, DC.
        </p>
        <p className="text-lg text-ink/75 leading-relaxed mb-4">
          We do not yet ship to US territories (Puerto Rico, Guam, the US Virgin Islands, American Samoa and the Northern Mariana Islands), to APO, FPO or DPO military addresses, or outside the United States.
        </p>
        <p className="text-lg text-ink/75 leading-relaxed mb-6">
          Anyone can still browse the site. If you are outside the US and have a question, please contact us.
        </p>
        <Link href="/contact" className="btn-primary">Contact us</Link>
      </section>
      <Footer />
    </>
  );
}

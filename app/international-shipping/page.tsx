import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";
import Link from "next/link";

export const metadata: Metadata = {
  title: "International shipping",
  description: "Contact IP6 Original with shipping questions.",
  alternates: hreflangAlternates("/international-shipping"),
};

export default function InternationalShippingPage() {
  return (
    <>
      <section className="container py-16 max-w-3xl">
        <p className="eyebrow mb-4">International shipping</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6">
          Where we ship.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed mb-6">
          For questions about shipping to your location, please contact us.
        </p>
        <Link href="/contact" className="btn-primary">Contact us</Link>
      </section>
      <Footer />
    </>
  );
}

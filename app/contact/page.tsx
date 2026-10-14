import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "./ContactForm";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact IP6 Original for customer support, wholesale inquiries, and press.",
  alternates: hreflangAlternates("/contact"),
};

export default function ContactPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12">
        <div>
          <p className="eyebrow mb-4">Contact</p>
          <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
            We read every message.
          </h1>
          <p className="text-lg text-ink/75 leading-relaxed mb-10">
            For order-specific questions, please include your order number.
          </p>
          <p className="mt-8 text-sm text-ink/70">Use the form to reach us. Every message goes to the store inbox and we reply by email.</p>
        </div>

        <ContactForm />
      </section>
      <Footer />
    </>
  );
}

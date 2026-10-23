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
          <p className="text-lg text-ink/75 leading-relaxed mb-8">
            For order-specific questions, please include your order number.
          </p>
          <dl className="space-y-4 text-sm text-ink/75 leading-relaxed border-t border-cloud-300 pt-6">
            <div>
              <dt className="font-semibold text-navy-800">How we reply</dt>
              <dd>By email, to the address you enter, within one business day (Monday to Friday).</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">Damaged or incorrect orders</dt>
              <dd>Choose Order question, add your order number, and describe what arrived. Photos of the item and the packaging help us sort it out in one reply.</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">After you send</dt>
              <dd>You will see a confirmation on this page straight away. If it does not appear, the message did not go through, so please try again.</dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </section>
      <Footer />
    </>
  );
}

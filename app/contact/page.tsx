import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "./ContactForm";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact IP-6 Research, Inc. — customer support, wholesale inquiries, and humanitarian program contacts.",
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
            Our team replies within one business day. For order-specific questions, please include your order number.
          </p>

          <dl className="space-y-6">
            <div>
              <dt className="font-display text-lg text-forest-800">Customer support</dt>
              <dd className="text-ink/75">
                <a href="mailto:support@ip6original.com" className="underline">
                  support@ip6original.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg text-forest-800">Wholesale & practitioner</dt>
              <dd className="text-ink/75">
                <a href="mailto:wholesale@ip6original.com" className="underline">
                  wholesale@ip6original.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg text-forest-800">Humanitarian programs</dt>
              <dd className="text-ink/75">
                <a href="mailto:programs@ip6original.com" className="underline">
                  programs@ip6original.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg text-forest-800">Press</dt>
              <dd className="text-ink/75">
                <a href="mailto:press@ip6original.com" className="underline">
                  press@ip6original.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </section>
      <Footer />
    </>
  );
}

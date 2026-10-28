import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { ContactForm } from "./ContactForm";
import { hreflangAlternates } from "@/lib/i18n";
import { EMAIL } from "@/lib/email-addresses";

const INBOXES = [
  { label: "Orders and support", address: EMAIL.support },
  { label: "Wholesale", address: EMAIL.wholesale },
  { label: "Press", address: EMAIL.press },
  { label: "Privacy", address: EMAIL.privacy },
  { label: "Everything else", address: EMAIL.hello },
];

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
              <dd>
                Email <a href={`mailto:${EMAIL.support}`} className="underline text-forest-700">{EMAIL.support}</a> as soon as it arrives with your order
                number and photos of the item and the packaging so we can review it and make it right.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">Email us directly</dt>
              <dd>
                <ul className="mt-1 space-y-1">
                  {INBOXES.map((i) => (
                    <li key={i.address}>
                      <span className="text-ink/60">{i.label}:</span>{" "}
                      <a href={`mailto:${i.address}`} className="underline text-forest-700 break-all">{i.address}</a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">Follow us</dt>
              <dd>
                <SocialLinks className="mt-1 text-forest-700" />
              </dd>
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

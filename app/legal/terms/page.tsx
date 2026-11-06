import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: hreflangAlternates("/legal/terms"),
};

const H2 = "font-display text-display-md text-forest-800 mb-3";

export default function TermsPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Terms of Service</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: October 20, 2026</p>
      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <h2 className={H2}>1. Acceptance</h2>
          <p>
            By using ip6original.com or placing an order you agree to these terms and to our{" "}
            <a href="/legal/privacy" className="underline text-forest-700">Privacy Policy</a>. If you don&apos;t agree, please don&apos;t use the
            site. You must be 18 or older to place an order.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. Orders, prices and payment</h2>
          <p>
            Prices are shown in the currency displayed at checkout. The total you see on the final checkout step, including shipping, any discount
            and any tax, is the amount charged. Payment is taken when you place the order. We may refuse or cancel an order, for example after a
            clear pricing error or suspected fraud; if we cancel, we refund what you paid in full.
          </p>
        </section>

        <section>
          <h2 className={H2}>3. Pre-orders</h2>
          <p>
            Items marked pre-order are charged when you order and ship when stock arrives, on the timing shown on the product page and at checkout.
            If you&apos;d like to cancel a pre-order before it ships, contact us and we will cancel it and refund you in full.
          </p>
        </section>

        <section>
          <h2 className={H2}>4. Discount codes</h2>
          <p>
            One code per order. Codes apply to merchandise, not shipping or tax, and can be combined with the pre-order discount. Each code&apos;s
            limits (dates, minimum order, number of uses) are checked at checkout. Codes have no cash value and we may end a code at any time;
            that never changes an order already placed.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. Subscriptions (automatic renewal)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your first delivery is charged at checkout.</li>
            <li>
              The subscription then renews automatically every cycle you chose (for example every 30 or 90 days) at the subscription price shown
              at checkout, plus standard shipping to the address you gave, charged to the card you used, until you cancel.
            </li>
            <li>We email you a reminder before each renewal.</li>
            <li>
              You can skip a delivery, pause or cancel at any time from{" "}
              <a href="/account/subscriptions" className="underline text-forest-700">your account</a>, or by contacting us. Changes made before a
              renewal is charged apply to that renewal; cancelling stops all future charges.
            </li>
            <li>If a renewal payment fails we&apos;ll email you; if it isn&apos;t fixed the subscription may be paused or ended.</li>
            <li>We&apos;ll tell you by email before any change to a subscription&apos;s price takes effect.</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>6. Shipping, returns and refunds</h2>
          <p>
            Shipping is covered by our <a href="/legal/shipping-policy" className="underline text-forest-700">Shipping Policy</a>. All sales are
            final once an order has shipped; see our <a href="/legal/refund-policy" className="underline text-forest-700">Refund Policy</a> for
            damaged or incorrect orders. Approved refunds go back to the original payment method.
          </p>
        </section>

        <section>
          <h2 className={H2}>7. Your account</h2>
          <p>
            Keep your password private and tell us if you think someone else has used your account. You&apos;re responsible for activity on your
            account. You can delete it at any time from your account page.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Reviews</h2>
          <p>
            Reviews must be your own honest experience. We check every review before publishing and don&apos;t publish reviews that claim a product
            treats, cures or prevents a disease, that include other people&apos;s personal data, or that are abusive. By submitting a review you let
            us display it, with the name you chose, on this site. You can ask us to remove it at any time.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. Health information</h2>
          <p>
            Content on this site is for information only and is not medical advice. Consult a qualified healthcare professional before using any
            supplement, especially if you are pregnant, nursing, taking medication or have a medical condition.
          </p>
          <p className="mt-3 text-sm text-ink/70">{DSHEA_DISCLAIMER}</p>
        </section>

        <section>
          <h2 className={H2}>10. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, IP6 Original is not liable for indirect or consequential losses arising from your use of our
            products or this website. Nothing in these terms limits rights you have under consumer protection law that can&apos;t be limited.
          </p>
        </section>

        <section>
          <h2 className={H2}>11. Governing law</h2>
          <p>These terms are governed by the laws of the State of Delaware, United States.</p>
        </section>

        <section>
          <h2 className={H2}>12. Changes and contact</h2>
          <p>
            We may update these terms; the version in force when you place an order applies to that order. Questions: use our{" "}
            <a href="/contact" className="underline text-forest-700">contact form</a>.
          </p>
        </section>
      </div>
    </>
  );
}

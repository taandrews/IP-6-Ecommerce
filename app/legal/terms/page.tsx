import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: hreflangAlternates("/legal/terms"),
};

export default function TermsPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Terms of Service</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>
      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">1. Acceptance</h2>
          <p>
            By accessing or placing an order on ip6original.com you agree to these Terms of Service. If you do not agree, please do not use the site.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">2. Orders and pricing</h2>
          <p>
            All prices are shown in the currency displayed at checkout. We reserve the right to correct pricing errors and to refuse or cancel any order at our discretion. Shipping costs and taxes are calculated at checkout based on your destination.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">3. Subscriptions</h2>
          <p>
            Subscription orders renew automatically on the frequency you select. You may pause, modify, or cancel subscriptions at any time through your account dashboard. Renewal reminders are sent before each charge.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">4. Health information</h2>
          <p>
            Content on this site is provided for informational purposes and is not medical advice. Consult a qualified healthcare professional before using any supplement or skincare product.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">5. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, IP-6 Research, Inc. is not liable for indirect or consequential damages arising from your use of our products or this website.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">6. Governing law</h2>
          <p>These terms are governed by the laws of the State of Delaware, United States.</p>
        </section>
      </div>
    </>
  );
}

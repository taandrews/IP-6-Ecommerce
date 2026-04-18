import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Shipping Policy",
  alternates: hreflangAlternates("/legal/shipping-policy"),
};

export default function ShippingPolicyPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Shipping Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>

      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Processing time</h2>
          <p>
            Orders are processed within 1–2 business days. Orders placed on weekends and US holidays ship the next business day.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Carriers</h2>
          <p>We ship via USPS, UPS, DHL Express, and partner posts depending on destination. Tracking is emailed when your order leaves our warehouse.</p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Duties and taxes</h2>
          <p>
            Where possible, import duties and taxes are calculated at checkout. Otherwise, duties are the responsibility of the recipient and are collected by the carrier on delivery.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Country eligibility</h2>
          <p>
            See our <a href="/international-shipping" className="underline text-forest-700">International Shipping</a> page for the current list of permitted countries for supplements and skincare. The IP6-Citrate Water Filter ships globally.
          </p>
        </section>
      </div>
    </>
  );
}

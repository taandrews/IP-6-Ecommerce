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
      <p className="text-sm text-ink/60 mb-10">Last updated: October 14, 2026</p>
      <div className="space-y-8 text-ink/80 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Rates and carriers</h2>
          <p>US orders over $75 ship free with standard shipping. All other shipping rates and carrier options are calculated at checkout from your address. Tracking is emailed when your order ships.</p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Pre-orders</h2>
          <p>Pre-ordered items start shipping in November 2026. You are charged at checkout and we ship when stock arrives.</p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Duties and taxes</h2>
          <p>
            Where possible, import duties and taxes are calculated at checkout. Otherwise, duties are the responsibility of the recipient and are collected by the carrier on delivery.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Where we ship</h2>
          <p>
            See our <a href="/international-shipping" className="underline text-forest-700">International Shipping</a> page for the current list of countries.
          </p>
        </section>
      </div>
    </>
  );
}

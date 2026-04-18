import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Refund Policy",
  alternates: hreflangAlternates("/legal/refund-policy"),
};

export default function RefundPolicyPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Refund Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>

      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">30-day returns</h2>
          <p>
            Unopened products may be returned within 30 days of delivery for a full refund to the original payment method. Buyer pays return shipping unless the product arrived damaged or defective.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Opened supplements and skincare</h2>
          <p>
            Opened supplement and skincare products may be exchanged for store credit within 30 days if the product did not perform as expected. Please contact support before returning.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Water filter</h2>
          <p>
            The IP6-Citrate Water Filter carries a 60-day return window. Cartridges must be unopened for a full refund.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Subscriptions</h2>
          <p>
            Subscription deliveries can be skipped, paused, or cancelled at any time from your account dashboard. Charges already processed are refundable per the policies above.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">How to start a return</h2>
          <p>
            Email{" "}
            <a href="mailto:support@ip6original.com" className="underline text-forest-700">
              support@ip6original.com
            </a>{" "}
            with your order number and we'll issue an RMA and prepaid label where applicable.
          </p>
        </section>
      </div>
    </>
  );
}

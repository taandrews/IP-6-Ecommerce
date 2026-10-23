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
      <p className="text-sm text-ink/60 mb-10">Last updated: October 14, 2026</p>
      <div className="space-y-8 text-ink/80 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">All sales are final</h2>
          <p>
            For your safety and our integrity, all sales are final once an order has shipped. Dietary supplements cannot be restocked or resold after they leave our care.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Damaged or incorrect orders</h2>
          <p>
            Please inspect your order when it arrives. If an item is damaged, defective, or not what you ordered, contact us right away through the{" "}
            <a href="/contact" className="underline text-forest-700">contact form</a>: choose <strong>Order question</strong>, include your order number, and attach photos of the item and the packaging. We reply by email within one business day. Each case is reviewed by a person so we can make it right. You do not need to return the item; keep it, with the packaging, until you hear from us.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Subscriptions</h2>
          <p>
            Subscription deliveries can be skipped, paused, or cancelled at any time from your account dashboard before the next charge. Charges already processed follow the policy above.
          </p>
        </section>
      </div>
    </>
  );
}

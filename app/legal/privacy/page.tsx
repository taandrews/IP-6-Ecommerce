import type { Metadata } from "next";
import { DataDeletionForm } from "./DataDeletionForm";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How IP-6 Research, Inc. collects, uses, and safeguards your personal data.",
  alternates: hreflangAlternates("/legal/privacy"),
};

export default function PrivacyPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Privacy Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>

      <div className="space-y-10 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">1. Who we are</h2>
          <p>
            IP-6 Research, Inc. (“we,” “us,” “our”) operates ip6original.com. We are the data controller for personal information collected through this site.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Contact details you provide: name, email, shipping and billing addresses, phone number.</li>
            <li>Order and payment information (card numbers are handled directly by Stripe; we do not store them).</li>
            <li>Account credentials managed through AWS Cognito.</li>
            <li>Technical information: IP address, device type, browser, pages viewed. Analytics data is only collected after you grant consent.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">3. How we use it</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Fulfilling orders, managing subscriptions, and providing customer support.</li>
            <li>Legal and regulatory compliance, including tax reporting.</li>
            <li>Product improvement and aggregated analytics (consent-based).</li>
            <li>Marketing communications you have opted into — unsubscribe at any time.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">4. Your rights</h2>
          <p>
            Depending on where you live, you have the right to access, correct, delete, or export your personal data, and to object to certain processing. Use the form below to request data deletion.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">5. International transfers</h2>
          <p>
            Our servers are operated via AWS (United States). Where applicable, we rely on Standard Contractual Clauses for EU and UK data transfers.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">6. Contact</h2>
          <p>
            Data protection requests can be sent to{" "}
            <a href="mailto:privacy@ip6original.com" className="underline text-forest-700">
              privacy@ip6original.com
            </a>
            .
          </p>
        </section>

        <section className="rounded-lg border border-ivory-300 bg-ivory-200 p-6">
          <h2 className="font-display text-xl text-forest-800 mb-2">Request data deletion</h2>
          <p className="text-sm text-ink/75 mb-4">
            Submit a request to remove your personal data from our systems. We confirm receipt within 5 business days and complete deletion within 30 days where legally permitted.
          </p>
          <DataDeletionForm />
        </section>
      </div>
    </>
  );
}

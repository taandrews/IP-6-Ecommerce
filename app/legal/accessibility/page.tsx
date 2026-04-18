import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  alternates: hreflangAlternates("/legal/accessibility"),
};

export default function AccessibilityPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Accessibility Statement</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>

      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <p>
            IP-6 Research, Inc. is committed to ensuring ip6original.com is accessible to people with disabilities. We target conformance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
          </p>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">What we do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Design with sufficient color contrast and readable typography.</li>
            <li>Provide meaningful alt text for all product and content imagery.</li>
            <li>Ensure keyboard access to all interactive elements, including cart, checkout, and account.</li>
            <li>Use semantic HTML and proper ARIA labeling where appropriate.</li>
            <li>Test with screen readers during new feature releases.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Feedback</h2>
          <p>
            If you encounter accessibility issues, please reach out to{" "}
            <a href="mailto:accessibility@ip6original.com" className="underline text-forest-700">
              accessibility@ip6original.com
            </a>
            . We aim to respond within one business day and resolve critical issues within 14 days.
          </p>
        </section>
      </div>
    </>
  );
}

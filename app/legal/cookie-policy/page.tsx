import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: hreflangAlternates("/legal/cookie-policy"),
};

export default function CookiePolicyPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Cookie Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: April 17, 2026</p>

      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <p>
            We use cookies and similar technologies to operate this site, improve performance, and personalize your experience. You can change your preferences anytime via the cookie banner or by clearing cookies in your browser.
          </p>
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Categories</h2>
          <dl className="space-y-5">
            <div>
              <dt className="font-medium text-forest-800">Essential</dt>
              <dd>Required for core functionality like cart, authentication, and CSRF protection. Cannot be disabled.</dd>
            </div>
            <div>
              <dt className="font-medium text-forest-800">Analytics</dt>
              <dd>We use Google Analytics 4 to understand aggregate site usage. IP addresses are anonymized. Disabled by default in the EU and UK until you grant consent.</dd>
            </div>
            <div>
              <dt className="font-medium text-forest-800">Marketing</dt>
              <dd>Meta Pixel (Facebook) to measure advertising effectiveness. Only loaded after you opt in.</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Your controls</h2>
          <p>
            Use the cookie banner on your first visit, or clear the <code>ip6_consent</code> cookie to be prompted again. You can also use browser-level tools to block or clear cookies.
          </p>
        </section>
      </div>
    </>
  );
}

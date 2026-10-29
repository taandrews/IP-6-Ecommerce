import type { Metadata } from "next";
import { hreflangAlternates } from "@/lib/i18n";
import { PrivacyChoicesButton } from "@/components/layout/PrivacyChoicesButton";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: hreflangAlternates("/legal/cookie-policy"),
};

const ROWS: Array<{ name: string; purpose: string; lasts: string }> = [
  { name: "ip6_session, ip6_access", purpose: "Keeps you signed in to your account (verified sign-in tokens).", lasts: "1 hour" },
  { name: "ip6_refresh", purpose: "Renews your sign-in so you stay signed in.", lasts: "30 days, or until you sign out" },
  { name: "ip6_challenge", purpose: "Holds a sign-in step (for example choosing a new password).", lasts: "5 minutes" },
  { name: "ip6_consent", purpose: "Remembers your cookie choices.", lasts: "1 year" },
  { name: "ip6_country", purpose: "Remembers the country you picked in the Ship to menu.", lasts: "1 year" },
  { name: "ip6quiz_seen_v1", purpose: "Stops the pre-order pop-up showing again (cookie and browser storage).", lasts: "30 days" },
  { name: "ip6-cart-v1 (browser storage)", purpose: "Keeps your cart between visits.", lasts: "Until you clear it" },
];

export default function CookiePolicyPage() {
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Cookie Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: October 28, 2026</p>

      <div className="space-y-8 text-ink/85 leading-relaxed">
        <section>
          <p>
            Cookies and browser storage keep this site working, and with your choice let us measure visits and advertising. You can change your
            choice at any time:
          </p>
          <PrivacyChoicesButton className="btn-secondary mt-4" />
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Essential (always on)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink/60">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2">How long</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-300">
                {ROWS.map((r) => (
                  <tr key={r.name}>
                    <td className="py-2 pr-4 font-mono text-xs">{r.name}</td>
                    <td className="py-2 pr-4">{r.purpose}</td>
                    <td className="py-2">{r.lasts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Analytics (optional)</h2>
          <p>
            Google Analytics 4 (cookies starting <code>_ga</code>) shows us, in aggregate, how the site is used. IP addresses are anonymized.
          </p>
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Marketing (optional)</h2>
          <p>Meta Pixel (cookie <code>_fbp</code>) measures whether our Facebook and Instagram ads lead to visits and orders.</p>
        </section>

        <section>
          <h2 className="font-display text-display-md text-forest-800 mb-3">Your choices</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>EU and UK visitors: analytics and marketing stay off until you choose to allow them.</li>
            <li>Everyone else: they run until you switch them off with Your privacy choices (US &ldquo;opt out of sharing&rdquo;).</li>
            <li>If your browser sends a Global Privacy Control signal, marketing stays off.</li>
            <li>Turning a category off takes effect from the next page you load. You can also clear cookies in your browser settings.</li>
          </ul>
        </section>
      </div>
    </>
  );
}

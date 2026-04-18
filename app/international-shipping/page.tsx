import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "International shipping",
  description:
    "IP-6 Research international shipping policy. Where we ship supplements, skincare, and the IP6-Citrate water filter.",
  alternates: hreflangAlternates("/international-shipping"),
};

const supplementCountries = (process.env.PERMITTED_SUPPLEMENT_COUNTRIES ?? "US,CA,GB,AU,DE,FR,IE,NL,NZ")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IE: "Ireland",
  NL: "Netherlands",
  NZ: "New Zealand",
};

export default function InternationalShippingPage() {
  return (
    <>
      <section className="container py-16 lg:py-24 max-w-3xl">
        <p className="eyebrow mb-4">International shipping</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          Where we ship.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed mb-10">
          Our shipping footprint is shaped by product category. The IP6-Citrate Water Filter ships globally. Supplements and skincare ship to a curated list of countries determined by regulatory considerations and customs handling.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="font-display text-display-md text-forest-800 mb-4">
              Supplements & skincare
            </h2>
            <p className="text-ink/80 leading-relaxed mb-6">
              IP6 Original Supplement and IP6 La Santé Cream currently ship to the following countries:
            </p>
            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {supplementCountries.map((c) => (
                <li
                  key={c}
                  className="rounded-md bg-ivory-200 border border-ivory-300 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium">{NAMES[c] ?? c}</span>
                  <span className="text-ink/60"> · {c}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-ink/60 mt-4">
              If your country isn't listed, please contact customer support — we review our shipping destinations quarterly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-display-md text-forest-800 mb-4">
              IP6-Citrate Water Filter
            </h2>
            <p className="text-ink/80 leading-relaxed">
              The water filter is a device, not a consumable, and ships to all countries serviced by our carrier partners. International duties and import taxes are the responsibility of the recipient and are calculated at checkout where possible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-display-md text-forest-800 mb-4">Delivery windows</h2>
            <ul className="space-y-2 text-ink/80">
              <li>• Domestic (US): 3–6 business days standard, 1–3 expedited.</li>
              <li>• North America & EU: 7–14 business days standard, 3–6 expedited.</li>
              <li>• Rest of world: 10–21 business days standard, 5–10 expedited.</li>
            </ul>
          </section>
        </div>
      </section>
      <Footer />
    </>
  );
}

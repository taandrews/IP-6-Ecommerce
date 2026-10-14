import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "International shipping",
  description: "Where IP6 Original ships. Rates are calculated at checkout.",
  alternates: hreflangAlternates("/international-shipping"),
};

// Matches the shipping zones configured in the store.
const COUNTRIES: Record<string, string> = {
  US: "United States",
  AE: "United Arab Emirates",
  AT: "Austria",
  AU: "Australia",
  BE: "Belgium",
  CA: "Canada",
  CH: "Switzerland",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  HK: "Hong Kong",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  MY: "Malaysia",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PL: "Poland",
  PT: "Portugal",
  SE: "Sweden",
  SG: "Singapore",
};

export default function InternationalShippingPage() {
  return (
    <>
      <section className="container py-16 max-w-3xl">
        <p className="eyebrow mb-4">International shipping</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6">
          Where we ship.
        </h1>
        <p className="text-lg text-ink/75 leading-relaxed mb-10">
          IP6 Original ships to the United States and the countries listed below. Shipping rates are calculated at checkout from your address. International duties and import taxes are the responsibility of the recipient. Tracking is emailed when your order ships.
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {Object.entries(COUNTRIES).map(([code, name]) => (
            <li key={code} className="flex justify-between border-b border-ivory-300 py-2">
              <span className="font-medium">{name}</span>
              <span className="text-ink/60">{code}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink/70">
          If your country is not listed, contact customer support.
        </p>
      </section>
      <Footer />
    </>
  );
}

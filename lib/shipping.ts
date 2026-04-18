import type { CartLine, Currency } from "@/types";

const SUPPLEMENT_COUNTRIES = (process.env.PERMITTED_SUPPLEMENT_COUNTRIES ?? "US,CA,GB,AU")
  .split(",")
  .map((c) => c.trim().toUpperCase());

export function canShipSupplement(countryCode: string) {
  return SUPPLEMENT_COUNTRIES.includes(countryCode.toUpperCase());
}

export interface ShippingRate {
  id: string;
  label: string;
  carrier: string;
  etaDays: [number, number];
  amountCents: number;
  currency: Currency;
}

export interface RateRequest {
  items: CartLine[];
  destinationCountry: string;
  destinationPostal: string;
  currency: Currency;
}

const DOMESTIC = ["US"];
const SAME_ECONOMIC_ZONE = ["CA", "GB", "AU", "DE", "FR", "IE", "NL", "NZ"];

// Baseline rate table. Replace with Shippo / EasyPost integration in production.
export function calculateRates(req: RateRequest): ShippingRate[] {
  const weight = req.items.reduce((sum, item) => sum + item.qty * 100, 0);
  const hasRestricted = req.items.some(
    (i) => i.sku.startsWith("SUP-") || i.sku.startsWith("SKN-"),
  );
  if (hasRestricted && !canShipSupplement(req.destinationCountry)) return [];

  const base =
    DOMESTIC.includes(req.destinationCountry.toUpperCase())
      ? 695
      : SAME_ECONOMIC_ZONE.includes(req.destinationCountry.toUpperCase())
        ? 1495
        : 2495;
  const perGram = DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? 0.8 : 1.6;
  const standard = Math.round(base + weight * perGram);
  const expedited = Math.round(standard * 1.6);

  return [
    {
      id: "standard",
      label: "Standard",
      carrier: "USPS / Local Post",
      etaDays: DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? [3, 6] : [7, 14],
      amountCents: standard,
      currency: req.currency,
    },
    {
      id: "expedited",
      label: "Expedited",
      carrier: "UPS / DHL Express",
      etaDays: DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? [1, 3] : [3, 6],
      amountCents: expedited,
      currency: req.currency,
    },
  ];
}

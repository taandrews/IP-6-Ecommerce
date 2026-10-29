import type { CartLine, Currency } from "@/types";
import type { PreorderSettings } from "@/types/records";
import { lineTotalCents } from "@/lib/preorder";
import { SHIP_COUNTRY_CODES } from "@/lib/countries";

/** Free standard shipping for US addresses once the discounted merchandise subtotal reaches this amount. Mirrors the Shopify rate. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FREE_SHIPPING_COUNTRIES = ["US"];

export function qualifiesForFreeShipping(subtotalCents: number, currency: Currency, country = "US") {
  return currency === "USD" && FREE_SHIPPING_COUNTRIES.includes(country.toUpperCase()) && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
}

// The sellable countries (lib/countries). PERMITTED_SUPPLEMENT_COUNTRIES can only narrow that list, never widen it.
const PERMITTED = process.env.PERMITTED_SUPPLEMENT_COUNTRIES?.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
const SUPPLEMENT_COUNTRIES = PERMITTED?.length ? SHIP_COUNTRY_CODES.filter((c) => PERMITTED.includes(c)) : [...SHIP_COUNTRY_CODES];

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
  items: Array<Pick<CartLine, "sku" | "qty" | "unitPriceCents" | "subscription">>;
  destinationCountry: string;
  destinationPostal: string;
  currency: Currency;
  /** Live pre-order settings; defaults apply when omitted. */
  preorder?: PreorderSettings;
  /** Merchandise total after all discounts, when the caller already knows it. */
  merchandiseCents?: number;
}

const DOMESTIC = ["US"];

/** Business days in transit after dispatch, by lane. Quoted at checkout and in site copy. */
export const TRANSIT_DAYS = {
  domesticStandard: [3, 6] as [number, number],
  domesticExpedited: [1, 3] as [number, number],
  internationalStandard: [7, 14] as [number, number],
  internationalExpedited: [3, 6] as [number, number],
};
const SAME_ECONOMIC_ZONE = ["CA", "GB", "AU", "DE", "FR", "IE", "NL", "NZ"];

// Baseline rate table. Replace with Shippo / EasyPost integration in production.
export function calculateRates(req: RateRequest): ShippingRate[] {
  const weight = req.items.reduce((sum, item) => sum + item.qty * 100, 0);
  const hasRestricted = req.items.some(
    (i) => i.sku.startsWith("SUP-") || i.sku.startsWith("PET-") || i.sku.startsWith("SKN-"),
  );
  if (hasRestricted && !canShipSupplement(req.destinationCountry)) return [];

  const base =
    DOMESTIC.includes(req.destinationCountry.toUpperCase())
      ? 695
      : SAME_ECONOMIC_ZONE.includes(req.destinationCountry.toUpperCase())
        ? 1495
        : 2495;
  const perGram = DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? 0.8 : 1.6;
  const merchandiseCents = req.merchandiseCents ?? req.items.reduce((s, i) => s + lineTotalCents(i, req.preorder), 0);
  const freeStandard = qualifiesForFreeShipping(merchandiseCents, req.currency, req.destinationCountry);
  const standard = freeStandard ? 0 : Math.round(base + weight * perGram);
  const expedited = Math.round((freeStandard ? base + weight * perGram : standard) * 1.6);

  return [
    {
      id: "standard",
      label: "Standard",
      carrier: "USPS / Local Post",
      etaDays: DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? TRANSIT_DAYS.domesticStandard : TRANSIT_DAYS.internationalStandard,
      amountCents: standard,
      currency: req.currency,
    },
    {
      id: "expedited",
      label: "Expedited",
      carrier: "UPS / DHL Express",
      etaDays: DOMESTIC.includes(req.destinationCountry.toUpperCase()) ? TRANSIT_DAYS.domesticExpedited : TRANSIT_DAYS.internationalExpedited,
      amountCents: expedited,
      currency: req.currency,
    },
  ];
}

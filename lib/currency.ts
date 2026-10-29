import type { Currency } from "@/types";

export const SUPPORTED_CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

/**
 * Prices are shown and charged in US dollars for every visitor while the
 * store sells to the US only (see SELLABLE_COUNTRIES in lib/countries).
 */
export function resolveCurrency(): Currency {
  return "USD";
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  CAD: "en-CA",
  GBP: "en-GB",
  AUD: "en-AU",
  EUR: "en-IE",
  INR: "en-IN",
};

export function formatPrice(cents: number, currency: Currency = "USD") {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(iso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cuid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function classifyIpCurrency(countryCode: string | undefined): Currency {
  switch (countryCode?.toUpperCase()) {
    case "CA":
      return "CAD";
    case "GB":
      return "GBP";
    case "AU":
    case "NZ":
      return "AUD";
    case "IN":
      return "INR";
    case "DE":
    case "FR":
    case "IE":
    case "NL":
    case "ES":
    case "IT":
    case "PT":
    case "BE":
    case "AT":
    case "FI":
      return "EUR";
    default:
      return "USD";
  }
}

export const EU_UK_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "GB",
]);

export function isEuOrUk(countryCode?: string) {
  return !!countryCode && EU_UK_COUNTRIES.has(countryCode.toUpperCase());
}

import type { Locale } from "@/types";
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";
import de from "./dictionaries/de.json";
import hi from "./dictionaries/hi.json";

export const SUPPORTED_LOCALES: Locale[] = ["en", "fr", "de", "hi"];
export const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  fr,
  de,
  hi,
};

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
}

export function hreflangAlternates(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com";
  // Current launch: English only at the root. Future locales will live at /{locale}{path}.
  return {
    canonical: `${base}${path}`,
    languages: Object.fromEntries(
      SUPPORTED_LOCALES.map((l) => [l, l === DEFAULT_LOCALE ? `${base}${path}` : `${base}/${l}${path}`]),
    ),
  };
}

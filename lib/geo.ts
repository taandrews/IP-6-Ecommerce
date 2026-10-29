import "server-only";
import { cookies, headers } from "next/headers";
import { isCountryCode, isSellableCountry } from "@/lib/countries";

/** The visitor's own choice from the "Ship to" switcher. */
export const COUNTRY_COOKIE = "ip6_country";

/**
 * Country from the request's IP, as CloudFront reports it (Amplify Hosting
 * forwards CloudFront-Viewer-Country to server code). Display only: it
 * chooses what a visitor sees, never what they can buy.
 */
export function ipCountry(): string | undefined {
  const h = headers();
  const raw = h.get("cloudfront-viewer-country") ?? h.get("x-vercel-ip-country") ?? undefined;
  return isCountryCode(raw) ? raw.toUpperCase() : undefined;
}

export interface VisitorGeo {
  /** The country the site shows buying options for. */
  country: string;
  /** Whether that country can be sold to (Add to Cart rather than Notify Me). */
  sellable: boolean;
  /** The IP country, when known. */
  ipCountry?: string;
}

/**
 * The switcher's choice wins, then the IP country. When neither is known
 * (local development, a missing header) the site shows buying options; the
 * checkout's address check still decides every sale.
 */
export function visitorGeo(): VisitorGeo {
  const chosen = cookies().get(COUNTRY_COOKIE)?.value;
  const ip = ipCountry();
  const country = isCountryCode(chosen) ? chosen.toUpperCase() : ip ?? "US";
  return { country, sellable: isSellableCountry(country), ...(ip ? { ipCountry: ip } : {}) };
}

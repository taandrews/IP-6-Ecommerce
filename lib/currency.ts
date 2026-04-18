import { cookies, headers } from "next/headers";
import { classifyIpCurrency } from "./utils";
import type { Currency } from "@/types";

export const SUPPORTED_CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

export function resolveCurrency(): Currency {
  const cookieStore = cookies();
  const chosen = cookieStore.get("ip6_currency")?.value as Currency | undefined;
  if (chosen && SUPPORTED_CURRENCIES.includes(chosen)) return chosen;

  const hdrs = headers();
  const country =
    hdrs.get("cloudfront-viewer-country") ??
    hdrs.get("x-vercel-ip-country") ??
    hdrs.get("x-country") ??
    undefined;
  return classifyIpCurrency(country);
}

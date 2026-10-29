"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { isSellableCountry } from "@/lib/countries";

interface GeoValue {
  country: string;
  sellable: boolean;
  ipCountry?: string;
  /** Saves the visitor's "Ship to" choice and re-renders the page for it. */
  setCountry: (code: string) => void;
}

const GeoContext = createContext<GeoValue>({ country: "US", sellable: true, setCountry: () => {} });

/** Fed by the root layout from lib/geo (cookie choice, then CloudFront's IP country). */
export function GeoProvider({ country, ipCountry, children }: { country: string; ipCountry?: string; children: React.ReactNode }) {
  const router = useRouter();
  const setCountry = useCallback(
    (code: string) => {
      document.cookie = `ip6_country=${encodeURIComponent(code.toUpperCase())};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      router.refresh();
    },
    [router],
  );
  return (
    <GeoContext.Provider value={{ country, sellable: isSellableCountry(country), ipCountry, setCountry }}>{children}</GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}

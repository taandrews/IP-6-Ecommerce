"use client";

import { useMemo } from "react";
import { Globe } from "lucide-react";
import { countryName, countryOptions } from "@/lib/countries";
import { useGeo } from "@/components/store/Geo";

function useOptions() {
  return useMemo(() => countryOptions(), []);
}

/**
 * "Ship to" country for the header (desktop and tablet). A native select sits
 * over the compact label, so the control is the real, accessible <select>.
 * It only changes what the visitor sees; checkout checks the address.
 */
export function CountrySwitcher() {
  const { country, setCountry } = useGeo();
  const options = useOptions();
  return (
    <label className="relative hidden sm:inline-flex items-center gap-1 px-2 py-2 rounded-md hover:bg-ivory-200 text-xs font-medium cursor-pointer focus-within:ring-2 focus-within:ring-gold-500">
      <Globe className="size-4" aria-hidden="true" />
      <span aria-hidden="true">{country}</span>
      <span className="sr-only">Ship to: {countryName(country)}. Change country</span>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The same choice inside the phone menu. */
export function CountryMenu() {
  const { country, setCountry } = useGeo();
  const options = useOptions();
  return (
    <div>
      <label htmlFor="menu-country" className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold mb-2 flex items-center gap-1.5">
        <Globe className="size-3.5" aria-hidden="true" /> Ship to
      </label>
      <select
        id="menu-country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full rounded-md border border-cloud-300 bg-surface px-3 py-2.5 text-sm text-navy-800"
      >
        {options.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-ink/55">Prices are in US dollars. We currently ship to US addresses only.</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import type { Currency } from "@/types";
import { cn } from "@/lib/utils";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return m?.[2];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

function useCurrency() {
  const [current, setCurrent] = useState<Currency>("USD");
  useEffect(() => {
    const fromCookie = getCookie("ip6_currency") as Currency | undefined;
    if (fromCookie && CURRENCIES.includes(fromCookie)) setCurrent(fromCookie);
  }, []);
  function choose(c: Currency) {
    setCurrent(c);
    setCookie("ip6_currency", c);
    window.location.reload();
  }
  return { current, choose };
}

/** Header dropdown (desktop and tablet). */
export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const { current, choose } = useCurrency();

  return (
    <div className="relative">
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${current}`}
        onClick={() => setOpen((o) => !o)}
        className="hidden sm:inline-flex items-center gap-1 px-2 py-2 rounded-md hover:bg-ivory-200 text-xs font-medium"
      >
        <Globe className="size-4" />
        {current}
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 min-w-[180px] bg-surface shadow-card rounded-md border border-ivory-300 py-1 z-50"
        >
          {CURRENCIES.map((c) => (
            <li key={c}>
              <button
                role="option"
                aria-selected={c === current}
                onClick={() => {
                  setOpen(false);
                  choose(c);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-ivory-200"
              >
                {c}
              </button>
            </li>
          ))}
          <li className="px-3 pt-1.5 pb-1 text-[11px] text-ink/55 border-t border-ivory-300 mt-1">
            Prices are shown and charged in the currency you choose.
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/** Inline list for the phone menu, where the header has no room for the dropdown. */
export function CurrencyMenu() {
  const { current, choose } = useCurrency();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold mb-2 flex items-center gap-1.5">
        <Globe className="size-3.5" /> Currency
      </p>
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Currency">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            role="option"
            aria-selected={c === current}
            onClick={() => choose(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              c === current ? "border-navy-800 bg-navy-800 text-surface" : "border-cloud-300 text-navy-800",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink/55">Prices are shown and charged in the currency you choose.</p>
    </div>
  );
}

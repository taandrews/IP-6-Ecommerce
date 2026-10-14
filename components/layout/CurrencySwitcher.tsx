"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import type { Currency } from "@/types";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return m?.[2];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Currency>("USD");

  useEffect(() => {
    const fromCookie = getCookie("ip6_currency") as Currency | undefined;
    if (fromCookie && CURRENCIES.includes(fromCookie)) setCurrent(fromCookie);
  }, []);

  function choose(c: Currency) {
    setCurrent(c);
    setCookie("ip6_currency", c);
    setOpen(false);
    window.location.reload();
  }

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
          className="absolute right-0 top-full mt-1 min-w-[120px] bg-surface shadow-card rounded-md border border-ivory-300 py-1 z-50"
        >
          {CURRENCIES.map((c) => (
            <li key={c}>
              <button
                role="option"
                aria-selected={c === current}
                onClick={() => choose(c)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-ivory-200"
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

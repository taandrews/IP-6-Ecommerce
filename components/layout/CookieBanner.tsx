"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConsentState = "unset" | "all" | "essential" | "custom";

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return m?.[2];
}
function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${value};path=/;max-age=${days * 86400};samesite=lax`;
}

export function CookieBanner({ isEuOrUk = false }: { isEuOrUk?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const c = getCookie("ip6_consent");
    if (!c && isEuOrUk) setVisible(true);
    if (!c && !isEuOrUk) {
      // In non-EU/UK markets, default-accept with a clear opt-out affordance.
      setCookie("ip6_consent", "all");
    }
  }, [isEuOrUk]);

  if (!visible) return null;

  function accept(state: ConsentState, details?: { analytics: boolean; marketing: boolean }) {
    const payload =
      state === "custom"
        ? `custom:${details?.analytics ? 1 : 0}:${details?.marketing ? 1 : 0}`
        : state;
    setCookie("ip6_consent", payload);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-lg z-50 bg-surface shadow-card border border-ivory-300 rounded-lg p-5 animate-fade-in"
    >
      <h2 className="font-display text-lg text-forest-800 mb-2">Cookie preferences</h2>
      <p className="text-sm text-ink/80 mb-4">
        We use cookies to run this site, measure performance, and personalize your experience. You
        can customize your choices or read more in our{" "}
        <Link href="/legal/cookie-policy" className="underline text-forest-700">
          Cookie Policy
        </Link>
        .
      </p>

      {customOpen ? (
        <div className="space-y-3 mb-4">
          <CheckRow label="Essential (always on)" value={true} disabled />
          <CheckRow label="Analytics" value={analytics} onChange={setAnalytics} />
          <CheckRow label="Marketing" value={marketing} onChange={setMarketing} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => accept("essential")}
          className="btn-ghost text-sm"
        >
          Reject non-essential
        </button>
        <button
          onClick={() => setCustomOpen((v) => !v)}
          className="btn-secondary text-sm"
        >
          {customOpen ? "Save selection" : "Customize"}
        </button>
        {customOpen ? (
          <button
            onClick={() => accept("custom", { analytics, marketing })}
            className="btn-primary text-sm"
          >
            Save selection
          </button>
        ) : (
          <button onClick={() => accept("all")} className="btn-primary text-sm">
            Accept all
          </button>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between text-sm cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-4 accent-forest-700"
      />
    </label>
  );
}

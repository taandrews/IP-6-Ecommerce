"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OPEN_CONSENT_EVENT,
  gpcEnabled,
  parseConsent,
  readConsentCookie,
  writeConsentCookie,
  type Consent,
} from "@/lib/consent";

/**
 * EU/UK visitors choose before any analytics or marketing cookie is set
 * (opt-in). Elsewhere the US opt-out model applies: analytics and marketing
 * run until the visitor opts out through "Your privacy choices" in the
 * footer, and a Global Privacy Control signal always switches marketing off.
 */
export function CookieBanner({ isEuOrUk = false }: { isEuOrUk?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const gpc = typeof window !== "undefined" && gpcEnabled();

  useEffect(() => {
    const current = parseConsent(readConsentCookie());
    if (!current) {
      if (isEuOrUk) setVisible(true);
      else writeConsentCookie({ analytics: true, marketing: !gpcEnabled() });
    }
    const open = () => {
      const c = parseConsent(readConsentCookie());
      setAnalytics(c?.analytics ?? false);
      setMarketing((c?.marketing ?? false) && !gpcEnabled());
      setCustomOpen(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, [isEuOrUk]);

  if (!visible) return null;

  function save(c: Consent) {
    writeConsentCookie({ analytics: c.analytics, marketing: c.marketing && !gpcEnabled() });
    setVisible(false);
    setCustomOpen(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-lg z-50 bg-surface shadow-card border border-ivory-300 rounded-lg p-5 animate-fade-in"
    >
      <h2 className="font-display text-lg text-forest-800 mb-2">Cookie preferences</h2>
      <p className="text-sm text-ink/80 mb-4">
        Essential cookies keep the site and your cart working. With your choice we also use analytics (Google Analytics) to understand visits and
        marketing (Meta Pixel) to measure ads. Read more in our{" "}
        <Link href="/legal/cookie-policy" className="underline text-forest-700">
          Cookie Policy
        </Link>
        .
      </p>

      {customOpen ? (
        <div className="space-y-3 mb-4">
          <CheckRow label="Essential (always on)" value={true} disabled />
          <CheckRow label="Analytics" value={analytics} onChange={setAnalytics} />
          <CheckRow label="Marketing and ad measurement" value={marketing && !gpc} onChange={setMarketing} disabled={gpc} />
          {gpc ? <p className="text-xs text-ink/60">Your browser's Global Privacy Control signal is on, so marketing stays off.</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 justify-end">
        <button onClick={() => save({ analytics: false, marketing: false })} className="btn-ghost text-sm">
          Reject non-essential
        </button>
        {customOpen ? (
          <button onClick={() => save({ analytics, marketing })} className="btn-primary text-sm">
            Save selection
          </button>
        ) : (
          <>
            <button onClick={() => setCustomOpen(true)} className="btn-secondary text-sm">
              Customize
            </button>
            <button onClick={() => save({ analytics: true, marketing: true })} className="btn-primary text-sm">
              Accept all
            </button>
          </>
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

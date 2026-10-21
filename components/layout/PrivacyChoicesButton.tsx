"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

/** "Your privacy choices": reopens the cookie settings (US opt-out of sale/sharing). */
export function PrivacyChoicesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Your privacy choices
    </button>
  );
}

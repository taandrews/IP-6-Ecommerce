/**
 * Cookie consent, stored in the ip6_consent cookie as "all", "essential" or
 * "custom:<analytics 0|1>:<marketing 0|1>". Browser-side only.
 *
 * Global Privacy Control (navigator.globalPrivacyControl) is honoured as an
 * opt-out of marketing ("sale/sharing" under CCPA/CPRA and other US state
 * laws) whatever the cookie says.
 */
export const CONSENT_COOKIE = "ip6_consent";
export const OPEN_CONSENT_EVENT = "ip6:open-consent";
export const CONSENT_CHANGED_EVENT = "ip6:consent-changed";

export interface Consent {
  analytics: boolean;
  marketing: boolean;
}

export function parseConsent(value: string | undefined | null): Consent | null {
  if (!value) return null;
  if (value === "all") return { analytics: true, marketing: true };
  if (value === "essential") return { analytics: false, marketing: false };
  const m = /^custom:([01]):([01])$/.exec(value);
  if (m) return { analytics: m[1] === "1", marketing: m[2] === "1" };
  return null;
}

export function serializeConsent(c: Consent): string {
  if (c.analytics && c.marketing) return "all";
  if (!c.analytics && !c.marketing) return "essential";
  return `custom:${c.analytics ? 1 : 0}:${c.marketing ? 1 : 0}`;
}

export function gpcEnabled(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** Final decision after applying GPC. */
export function effectiveConsent(c: Consent | null): Consent {
  const base = c ?? { analytics: false, marketing: false };
  return gpcEnabled() ? { analytics: base.analytics, marketing: false } : base;
}

export function readConsentCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`));
  return m?.[1];
}

export function writeConsentCookie(c: Consent) {
  const secure = location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(c)};path=/;max-age=${365 * 86400};samesite=lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

/**
 * Campaign attribution for sign-up forms: the utm_source, utm_medium and
 * utm_campaign of the link that brought the visitor in. Kept for the browser
 * session only (sessionStorage "ip6_campaign"), and only with analytics
 * consent, so a sign-up a few pages later still records which link it came
 * from. Browser-side only.
 */
import { effectiveConsent, parseConsent, readConsentCookie } from "@/lib/consent";

export const CAMPAIGN_KEY = "ip6_campaign";

export interface Campaign {
  source?: string;
  medium?: string;
  campaign?: string;
}

/** Letters, digits and simple separators only; anything else is dropped. */
export const CAMPAIGN_VALUE = /^[\w .+%-]{1,100}$/;

function fromUrl(search: string): Campaign | null {
  const q = new URLSearchParams(search);
  const c: Campaign = {};
  for (const k of ["source", "medium", "campaign"] as const) {
    const v = q.get(`utm_${k}`)?.trim();
    if (v && CAMPAIGN_VALUE.test(v)) c[k] = v;
  }
  return Object.keys(c).length ? c : null;
}

function allowed() {
  return effectiveConsent(parseConsent(readConsentCookie())).analytics;
}

/** Records the landing link's campaign; the first one in the session wins. */
export function rememberCampaign() {
  if (!allowed()) return;
  const c = fromUrl(location.search);
  if (!c) return;
  try {
    if (!sessionStorage.getItem(CAMPAIGN_KEY)) sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(c));
  } catch {
    // Storage blocked: the current URL is still read at sign-up.
  }
}

/** The campaign to attach to a sign-up, or undefined without consent or a tagged link. */
export function currentCampaign(): Campaign | undefined {
  if (!allowed()) return undefined;
  try {
    const saved = sessionStorage.getItem(CAMPAIGN_KEY);
    if (saved) return JSON.parse(saved) as Campaign;
  } catch {
    // Fall back to the current URL.
  }
  return fromUrl(location.search) ?? undefined;
}

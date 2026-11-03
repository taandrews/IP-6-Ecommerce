/**
 * The exact wording beside the waitlist consent checkbox, and its version.
 * Bump the version whenever the wording changes; each signup stores it.
 */
export const WAITLIST_CONSENT_VERSION = "2026-10-28";
/**
 * Remembers that a visitor outside the countries we sell to closed the
 * launch-list band and card ("closed") or signed up ("joined"), so neither
 * shows again. Read by the root layout so the band is never drawn and removed.
 */
export const WAITLIST_PROMPT_COOKIE = "ip6_waitlist_prompt";
export type WaitlistPrompt = "closed" | "joined";

export const WAITLIST_CONSENT_TEXT = "Email me when IP6 Original launches in my country, plus product news.";

/**
 * Forms carry a hidden "website" field that people never see or fill in.
 * Bots that fill every field give themselves away; they get a normal-looking
 * success reply and nothing is saved or sent.
 */
export const HONEYPOT_FIELD = "website";

export function isBot(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

import "server-only";
import crypto from "node:crypto";

/**
 * A short-lived token proving this browser just signed up `subject` (an
 * email) after passing the CAPTCHA, so follow-up saves from the same form
 * (the quiz answers) don't need a second puzzle. HMAC-signed with the
 * CAPTCHA key; nothing is stored.
 */
const TTL_MS = 30 * 60 * 1000;

function sign(key: string, subject: string, exp: number) {
  return crypto.createHmac("sha256", key).update(`${subject}|${exp}`).digest("base64url");
}

export function issueFormToken(key: string, subject: string): string {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(key, subject, exp)}`;
}

/** `keys`: the current key first, then the previous one during a rotation. */
export function checkFormToken(keys: string[], subject: string, token: unknown): boolean {
  if (typeof token !== "string" || token.length > 200) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() || !mac) return false;
  const a = Buffer.from(mac);
  return keys.some((key) => {
    const b = Buffer.from(sign(key, subject, exp));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

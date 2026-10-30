import "server-only";
import crypto from "node:crypto";
import { getFormTokenKey } from "@/lib/aws/secrets";

/**
 * A short-lived token proving this browser just signed up `subject` (an
 * email) after passing the CAPTCHA, so follow-up saves from the same form
 * (the quiz answers) don't need a second check. HMAC-signed with a key from
 * Secrets Manager that rotates monthly; nothing is stored.
 */
const TTL_MS = 30 * 60 * 1000;

const g = globalThis as typeof globalThis & { __ip6DevFormKey?: string };

/** The signing key and, after a rotation, the one before it (still accepted). */
export async function formTokenKeys(): Promise<string[]> {
  const keys = await getFormTokenKey();
  if (keys) return keys.previous ? [keys.current, keys.previous] : [keys.current];
  if (process.env.NODE_ENV === "production") throw new Error("form token key is not configured");
  // Local development only: one random key per process.
  g.__ip6DevFormKey ??= crypto.randomBytes(32).toString("base64");
  return [g.__ip6DevFormKey];
}

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

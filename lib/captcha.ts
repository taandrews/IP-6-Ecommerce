import "server-only";
import crypto from "node:crypto";
import { createChallenge, verifySolution } from "altcha-lib";
import type { Payload } from "altcha-lib/types";
import { getCaptchaKey } from "@/lib/aws/secrets";
import { claimOnce } from "@/lib/rate-limit";

/**
 * ALTCHA proof-of-work CAPTCHA (open source, self-hosted: no third party sees
 * visitors, no cookies). The server hands out a signed puzzle; the browser
 * spends a moment of CPU solving it; the form sends the answer back. A bot
 * filling forms in bulk pays that cost on every submission. Each solved
 * puzzle is accepted once and expires after 10 minutes.
 */

/** About half a second of work on a phone. */
const MAX_NUMBER = 100_000;
const EXPIRES_MS = 10 * 60 * 1000;

const g = globalThis as typeof globalThis & { __ip6DevCaptchaKey?: string };

/** The signing key and, after a rotation, the one before it (still accepted). */
export async function captchaKeys(): Promise<string[]> {
  const keys = await getCaptchaKey();
  if (keys) return keys.previous ? [keys.current, keys.previous] : [keys.current];
  if (process.env.NODE_ENV === "production") throw new Error("captcha key is not configured");
  // Local development only: one random key per process.
  g.__ip6DevCaptchaKey ??= crypto.randomBytes(32).toString("base64");
  return [g.__ip6DevCaptchaKey];
}

export async function newChallenge() {
  const [current] = await captchaKeys();
  return createChallenge({ hmacKey: current!, maxnumber: MAX_NUMBER, expires: new Date(Date.now() + EXPIRES_MS) });
}

/** The field name the widget submits its answer under. */
export const CAPTCHA_FIELD = "altcha";

/**
 * True only for a correctly solved, unexpired puzzle signed by this server
 * that hasn't been used before.
 */
export async function verifyCaptcha(raw: unknown): Promise<boolean> {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return false;
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Payload;
  } catch {
    return false;
  }
  if (typeof payload?.signature !== "string" || !/^[a-f0-9]{64}$/.test(payload.signature)) return false;
  let ok = false;
  for (const key of await captchaKeys()) {
    ok = await verifySolution(payload, key, true).catch(() => false);
    if (ok) break;
  }
  if (!ok) return false;
  // Replay protection: a solved puzzle works for one submission only.
  return claimOnce(`captcha:${payload.signature}`, Math.ceil(EXPIRES_MS / 1000) + 60);
}

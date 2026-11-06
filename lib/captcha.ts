import "server-only";
import { createHash } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { getTurnstileSecret } from "@/lib/aws/secrets";
import { clientIpFrom } from "@/lib/client-ip";
import type { CaptchaAction } from "@/components/ui/Captcha";

/**
 * Cloudflare Turnstile. The browser widget (components/ui/Captcha.tsx) gets a
 * one-time token from Cloudflare; the server checks it with Cloudflare's
 * siteverify API before acting on the form. Cloudflare refuses a token
 * after its first use, but two checks of the same token a moment apart can
 * both pass, so the site also records each token it accepts and refuses it
 * the second time. If Cloudflare or that record can't be reached the form is
 * refused (fails closed).
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The hidden field the widget adds to its form. */
export const CAPTCHA_FIELD = "cf-turnstile-response";

/** Sites the widget may run on; a token issued anywhere else is refused. */
function allowedHosts(): Set<string> {
  const hosts = new Set(["ip6original.com", "www.ip6original.com"]);
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname);
  } catch {
    /* ignore a malformed setting */
  }
  return hosts;
}

interface SiteVerify {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

/** True only for a fresh, unused token Cloudflare issued on one of our sites for this form. */
export async function verifyCaptcha(token: unknown, req: Request, action: CaptchaAction): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: await getTurnstileSecret(), response: token });
  const ip = clientIpFrom(req.headers, "");
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const out = (await res.json()) as SiteVerify;
    if (!out.success) return false;
    // Cloudflare's test keys report "example.com" and no form; real keys report the page's host and form.
    if (process.env.NODE_ENV === "production") {
      if (out.hostname === undefined || !allowedHosts().has(out.hostname)) return false;
      if (out.action !== action) return false;
    }
    return await firstUse(token);
  } catch (err) {
    console.error("[captcha] siteverify failed", (err as Error).name);
    return false;
  }
}

/** Tokens live for 300 seconds at Cloudflare; the record outlasts that. */
const TOKEN_RECORD_SEC = 600;

/**
 * Records the token (as a hash) and returns false if it was already recorded,
 * so one token can't pass two requests even when they race. Throws if the
 * record can't be written, which the caller treats as a refusal.
 */
async function firstUse(token: string): Promise<boolean> {
  const key = `captcha#${createHash("sha256").update(token).digest("hex")}`;
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.RateLimits,
        Item: { key, expiresAt: Math.floor(Date.now() / 1000) + TOKEN_RECORD_SEC },
        ConditionExpression: "attribute_not_exists(#k)",
        ExpressionAttributeNames: { "#k": "key" },
      }),
    );
    return true;
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

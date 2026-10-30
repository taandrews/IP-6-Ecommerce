import "server-only";
import { getTurnstileSecret } from "@/lib/aws/secrets";
import { clientIpFrom } from "@/lib/client-ip";

/**
 * Cloudflare Turnstile. The browser widget (components/ui/Captcha.tsx) gets a
 * one-time token from Cloudflare; the server checks it with Cloudflare's
 * siteverify API before acting on the form. Cloudflare accepts each token
 * once and only for a few minutes, so a token can't be replayed. If
 * Cloudflare can't be reached the form is refused (fails closed).
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The hidden field the widget adds to its form. */
export const CAPTCHA_FIELD = "cf-turnstile-response";

/** Sites the widget may run on; a token issued anywhere else is refused. */
function allowedHosts(): Set<string> {
  const hosts = new Set(["ip6original.com", "www.ip6original.com", "localhost"]);
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
  "error-codes"?: string[];
}

/** True only for a fresh, unused token Cloudflare issued for one of our sites. */
export async function verifyCaptcha(token: unknown, req: Request): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: await getTurnstileSecret(), response: token });
  const ip = clientIpFrom(req.headers, "");
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const out = (await res.json()) as SiteVerify;
    if (!out.success) return false;
    // Cloudflare's test keys report "example.com"; real keys report the page's host.
    return process.env.NODE_ENV !== "production" || (out.hostname !== undefined && allowedHosts().has(out.hostname));
  } catch (err) {
    console.error("[captcha] siteverify failed", (err as Error).name);
    return false;
  }
}

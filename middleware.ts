import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIES, sameSiteFor, secureCookies, type Realm } from "@/lib/auth/config";
import { verifyIdToken, unverifiedUsername, type VerifiedUser } from "@/lib/auth/jwt";
import { refreshTokens } from "@/lib/auth/refresh";
import { roleFromGroups } from "@/lib/auth/roles";
import { isShopifyOrigin } from "@/lib/storefronts";

const ADMIN_PUBLIC = /^\/admin\/(login|forgot-password)(?:\/|$)/;
const ADMIN_PATH = /^\/admin(?:\/|$)/;
const ADMIN_API = /^\/api\/admin\//;
const ACCOUNT_PATH = /^\/account(?!\/(login|register|forgot-password))(?:\/|$)/;
const AUTH_API = /^\/api\/(auth|admin\/auth)\//;
const RATE_LIMITED = /^\/api\/(shipping|reviews|newsletter|waitlist|privacy|contact|checkout|auth|admin\/auth)/;
/** Server-to-server callers that never carry a browser Origin. */
const ORIGIN_EXEMPT = /^\/api\/stripe\/webhook$/;
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Per-instance limiter. Cognito adds its own lockout on repeated failed
// sign-ins; this only blunts bursts against the public endpoints.
const buckets = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;

function allow(key: string, max: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.ts > WINDOW_MS) {
    buckets.set(key, { count: 1, ts: now });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (now - v.ts > WINDOW_MS) buckets.delete(k);
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

function json(status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) {
  return new NextResponse(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...extra } });
}

/**
 * CSRF defence for cookie-authenticated requests: a state-changing request
 * must come from this site. Browsers send Origin on POST/PUT/PATCH/DELETE
 * fetches and form posts; a foreign origin, or a cross-site fetch without
 * one, is refused.
 */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    const allowed = new Set([req.nextUrl.origin]);
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      try {
        allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
      } catch {
        /* ignore malformed config */
      }
    }
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    if (host) allowed.add(`${proto}://${host}`);
    return allowed.has(origin);
  }
  return req.headers.get("sec-fetch-site") !== "cross-site";
}

interface Resolved {
  user: VerifiedUser | null;
  renewed: { idToken: string; accessToken: string; expiresIn: number } | null;
  refreshFailed: boolean;
}

/** Verifies the realm's ID token, or renews it with that realm's refresh token. */
async function resolve(req: NextRequest, realm: Realm, allowRefresh: boolean): Promise<Resolved> {
  const names = AUTH_COOKIES[realm];
  const idToken = req.cookies.get(names.id)?.value;
  const refreshToken = req.cookies.get(names.refresh)?.value;
  let user = idToken ? await verifyIdToken(idToken, realm) : null;
  if (user || !refreshToken || !allowRefresh) return { user, renewed: null, refreshFailed: false };
  const renewed = await refreshTokens(refreshToken, unverifiedUsername(idToken), realm);
  user = renewed ? await verifyIdToken(renewed.idToken, realm) : null;
  return { user, renewed: user ? renewed : null, refreshFailed: !user };
}

function opts(realm: Realm, maxAge: number) {
  return { httpOnly: true, secure: secureCookies(), sameSite: sameSiteFor(realm), path: "/", maxAge };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.ip ?? "unknown";

  if (RATE_LIMITED.test(pathname)) {
    const auth = AUTH_API.test(pathname);
    if (!allow(`${ip}:${auth ? "auth" : "api"}`, auth ? 10 : 30)) {
      return json(429, { error: "rate_limited" }, { "Retry-After": "60" });
    }
  }

  // The Shopify storefront may post its launch-waitlist form here (no cookies or login involved).
  const shopifyWaitlist = pathname === "/api/waitlist" && isShopifyOrigin(req.headers.get("origin"));
  if (isApi && MUTATING.has(req.method) && !ORIGIN_EXEMPT.test(pathname) && !shopifyWaitlist && !sameOrigin(req)) {
    return json(403, { error: "bad_origin" });
  }

  // Admin pages and admin APIs use the STAFF pool; everything else the customer pool.
  const realm: Realm = ADMIN_PATH.test(pathname) || ADMIN_API.test(pathname) ? "staff" : "customer";
  const { user, renewed, refreshFailed } = await resolve(req, realm, !AUTH_API.test(pathname));
  const names = AUTH_COOKIES[realm];

  if (ADMIN_PATH.test(pathname) && !ADMIN_PUBLIC.test(pathname) && (!user || !roleFromGroups(user.groups))) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    const res = NextResponse.redirect(url);
    if (refreshFailed) res.cookies.delete(names.refresh);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  if (ACCOUNT_PATH.test(pathname) && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/login";
    url.search = "";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    const res = NextResponse.redirect(url);
    if (refreshFailed) res.cookies.delete(names.refresh);
    return res;
  }

  // Tell the root layout which area this is, so admin pages never load the
  // storefront chrome or analytics. Any client-sent value is discarded.
  const headers = new Headers(req.headers);
  headers.delete("x-ip6-area");
  if (ADMIN_PATH.test(pathname)) headers.set("x-ip6-area", "admin");

  // Forward renewed tokens to this request's handlers and to the browser.
  let res: NextResponse;
  if (renewed) {
    const jar = new Map(req.cookies.getAll().map((c) => [c.name, c.value]));
    jar.set(names.id, renewed.idToken);
    jar.set(names.access, renewed.accessToken);
    headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    res = NextResponse.next({ request: { headers } });
    const ttl = Math.max(60, Math.min(renewed.expiresIn, 3600));
    res.cookies.set(names.id, renewed.idToken, opts(realm, ttl));
    res.cookies.set(names.access, renewed.accessToken, opts(realm, ttl));
  } else {
    res = NextResponse.next({ request: { headers } });
    if (!user && req.cookies.get(names.id)) res.cookies.delete(names.id);
    if (refreshFailed) res.cookies.delete(names.refresh);
  }

  if (realm === "staff") {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};

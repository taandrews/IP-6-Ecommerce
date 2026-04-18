import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH = /^\/admin(?:\/|$)/;
const ACCOUNT_PATH = /^\/account(?!\/(login|register|forgot-password))(?:\/|$)/;
const API_RATE_LIMITED = /^\/api\/(shipping|reviews|newsletter|privacy|contact)/;

const buckets = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = buckets.get(ip);
  if (!entry || now - entry.ts > WINDOW_MS) {
    buckets.set(ip, { count: 1, ts: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) return false;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (API_RATE_LIMITED.test(pathname)) {
    if (!rateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  const session = req.cookies.get("ip6_session")?.value;
  const isAdmin = req.cookies.get("ip6_admin")?.value === "1";

  if (ADMIN_PATH.test(pathname) && !isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/login";
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "admin_required");
    return NextResponse.redirect(url);
  }

  if (ACCOUNT_PATH.test(pathname) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};

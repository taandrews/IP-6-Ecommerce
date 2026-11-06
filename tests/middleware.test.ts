import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

beforeAll(() => {
  process.env.COGNITO_USER_POOL_ID = "us-east-1_CUSTOMER";
  process.env.COGNITO_CLIENT_ID = "customer-client";
  process.env.STAFF_COGNITO_USER_POOL_ID = "us-east-1_STAFF";
  process.env.STAFF_COGNITO_CLIENT_ID = "staff-client";
  // Keys can't be fetched in tests, so every token fails verification, as a forged one would.
  process.env.COGNITO_ISSUER = "http://127.0.0.1:9/customer";
  process.env.STAFF_COGNITO_ISSUER = "http://127.0.0.1:9/staff";
});

const req = (url: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(new URL(url, "http://localhost:3058"), { method: init.method ?? "GET", headers: init.headers });

describe("middleware", () => {
  it("blocks cross-site state-changing API calls (CSRF)", async () => {
    const res = await middleware(req("/api/admin/discounts", { method: "POST", headers: { origin: "https://evil.example" } }));
    expect(res.status).toBe(403);
    const res2 = await middleware(req("/api/checkout/session", { method: "POST", headers: { "sec-fetch-site": "cross-site" } }));
    expect(res2.status).toBe(403);
  });

  it("refuses cross-site posts to the public forms", async () => {
    const other = { method: "POST", headers: { origin: "https://other.example" } };
    expect((await middleware(req("/api/waitlist", other))).status).toBe(403);
    expect((await middleware(req("/api/newsletter", other))).status).toBe(403);
  });

  it("lets the Stripe webhook through without an Origin", async () => {
    const res = await middleware(req("/api/stripe/webhook", { method: "POST", headers: { origin: "https://evil.example" } }));
    expect(res.status).toBe(200);
  });

  it("sends anyone without a verified staff token to the staff login", async () => {
    const res = await middleware(req("/admin/orders"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("ignores the old forgeable ip6_admin cookie and a fake staff token", async () => {
    const fake = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"cognito:groups":["owner"]}').toString("base64url")}.`;
    const res = await middleware(req("/admin", { headers: { cookie: `ip6_admin=1; ip6_staff_session=${fake}` } }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("never treats a customer session as staff", async () => {
    const res = await middleware(req("/admin", { headers: { cookie: "ip6_session=whatever" } }));
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("leaves the staff login page public and marks admin responses no-store", async () => {
    const res = await middleware(req("/admin/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("requires a customer session for account pages", async () => {
    const res = await middleware(req("/account/orders"));
    expect(res.headers.get("location")).toContain("/account/login");
  });
});

describe("staff portal on its own hostname", () => {
  const ADMIN = "https://admin.ip6original.com";
  const on = (host: string, path: string, method = "GET") =>
    middleware(new NextRequest(new URL(path, `https://${host}`), { method, headers: { host } }));

  it("serves the portal only on the admin host and nothing else there", async () => {
    process.env.NEXT_PUBLIC_ADMIN_ORIGIN = ADMIN;
    try {
      // Storefront host: /admin moves to the admin host; the admin API is not there at all.
      const moved = await on("ip6original.com", "/admin/login?next=%2Fadmin");
      expect(moved.status).toBe(308);
      expect(moved.headers.get("location")).toBe(`${ADMIN}/admin/login?next=%2Fadmin`);
      expect((await on("ip6original.com", "/api/admin/staff", "POST")).status).toBe(404);
      // Admin host: the portal answers, never indexed; storefront pages go to the portal.
      const login = await on("admin.ip6original.com", "/admin/login");
      expect(login.status).toBe(200);
      expect(login.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      const home = await on("admin.ip6original.com", "/shop");
      expect(home.status).toBe(308);
      expect(home.headers.get("location")).toBe(`${ADMIN}/admin`);
      expect((await on("admin.ip6original.com", "/api/waitlist", "POST")).status).toBe(404);
    } finally {
      delete process.env.NEXT_PUBLIC_ADMIN_ORIGIN;
    }
  });

  it("serves everything on every host when no admin host is configured (local dev)", async () => {
    expect((await on("localhost:3058", "/admin/login")).status).toBe(200);
  });
});

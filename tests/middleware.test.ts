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
    const res2 = await middleware(req("/api/checkout/intent", { method: "POST", headers: { "sec-fetch-site": "cross-site" } }));
    expect(res2.status).toBe(403);
  });

  it("accepts the Shopify storefront only on the waitlist endpoint", async () => {
    const shop = { method: "POST", headers: { origin: "https://ip6original.com" } };
    expect((await middleware(req("/api/waitlist", shop))).status).toBe(200);
    expect((await middleware(req("/api/checkout/intent", shop))).status).toBe(403);
    expect((await middleware(req("/api/newsletter", shop))).status).toBe(403);
    expect((await middleware(req("/api/waitlist", { method: "POST", headers: { origin: "https://evil.example" } }))).status).toBe(403);
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

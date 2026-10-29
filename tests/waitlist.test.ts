import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const hdrs = vi.hoisted(() => ({ map: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  headers: () => ({ get: (k: string) => hdrs.map.get(k.toLowerCase()) ?? null }),
  cookies: () => ({ get: () => undefined }),
}));

const ddb = mockClient(DynamoDBDocumentClient);
const { POST } = await import("@/app/api/waitlist/route");

const body = { email: "Ana@Example.com", country: "gb", consent: true, product: "SUP-IP6-CAP240", page: "/shop?x=1", source: "product" };
const req = (b: unknown) => new Request("http://localhost/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

beforeEach(() => {
  ddb.reset();
  ddb.on(UpdateCommand).resolves({});
  hdrs.map = new Map([["cloudfront-viewer-country", "GB"], ["x-forwarded-for", "203.0.113.9"]]);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("launch waitlist", () => {
  it("saves the signup with proof of consent and the IP country, never the IP address", async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(input.Key).toEqual({ userId: "waitlist_ana@example.com" });
    const saved = Object.fromEntries(
      Object.entries(input.ExpressionAttributeNames!).map(([ph, name]) => [name, input.ExpressionAttributeValues![ph.replace("#", ":")]]),
    );
    expect(saved).toMatchObject({ email: "ana@example.com", country: "GB", ipCountry: "GB", consentVersion: "2026-10-28", page: "/shop", lastProduct: "SUP-IP6-CAP240", source: "product" });
    expect(input.UpdateExpression).toContain("list_append");
    expect(JSON.stringify(input)).not.toContain("203.0.113.9");
  });

  it("answers the Shopify storefront with CORS and records the site", async () => {
    const shopReq = (b: unknown) => new Request("http://localhost/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://ip6original.com" }, body: JSON.stringify(b) });
    const res = await POST(shopReq({ ...body, site: "shopify" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://ip6original.com");
    const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(Object.values(input.ExpressionAttributeValues!)).toContain("shopify");
    const { OPTIONS } = await import("@/app/api/waitlist/route");
    const pre = OPTIONS(new Request("http://localhost/api/waitlist", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }));
    expect(pre.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("requires the consent box", async () => {
    const res = await POST(req({ ...body, consent: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("tick the box");
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });

  it("rejects a country we already sell to, an unknown country and an unknown product", async () => {
    expect((await POST(req({ ...body, country: "US" }))).status).toBe(400);
    expect((await POST(req({ ...body, country: "ZZ" }))).status).toBe(400);
    expect((await POST(req({ ...body, product: "NOPE" }))).status).toBe(400);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

vi.mock("@/lib/captcha", () => ({ verifyCaptcha: async (v: unknown) => typeof v === "string" && v !== "bad" }));
const confirm = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/lib/data/confirmations", () => ({ requestConfirmation: async (...a: unknown[]) => { confirm.calls.push(a); } }));
vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));

const hdrs = vi.hoisted(() => ({ map: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  headers: () => ({ get: (k: string) => hdrs.map.get(k.toLowerCase()) ?? null }),
  cookies: () => ({ get: () => undefined }),
}));

const ddb = mockClient(DynamoDBDocumentClient);
const { POST } = await import("@/app/api/waitlist/route");

const body = { email: "Ana@Example.com", firstName: "Ana", country: "gb", consent: true, product: "SUP-IP6-CAP240", page: "/shop?x=1", source: "product", captcha: "solved" };
const req = (b: unknown) => new Request("http://localhost/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

beforeEach(() => {
  ddb.reset();
  ddb.on(UpdateCommand).resolves({});
  ddb.on(GetCommand).resolves({});
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
    // The first sign-up's form and page are kept for attribution.
    expect(saved).toMatchObject({ signupSource: "product", signupPage: "/shop" });
    // The first sign-up's details, consent and attribution are kept; a stranger re-using the address can't change them.
    const kept = (field: string) => {
      const ph = Object.entries(input.ExpressionAttributeNames!).find(([, n]) => n === field)![0];
      return input.UpdateExpression!.includes(`${ph} = if_not_exists(${ph}, `);
    };
    expect(["email", "country", "consentedAt", "firstName", "signupSource", "signupPage"].every(kept)).toBe(true);
    // The latest page and form are refreshed on every sign-up.
    expect(["page", "source"].some(kept)).toBe(false);
    // Unconfirmed sign-ups expire; a confirmed one never gets an expiry.
    const expiry = ddb.commandCalls(UpdateCommand)[1]!.args[0].input;
    expect(expiry.UpdateExpression).toBe("SET #exp = :exp");
    expect(expiry.ConditionExpression).toBe("attribute_not_exists(#cf)");
    const products = ddb.commandCalls(UpdateCommand)[2]!.args[0].input;
    expect(products.UpdateExpression).toContain("list_append");
    // Each product is listed once, so repeat sign-ups can't grow the row.
    expect(products.ConditionExpression).toContain("NOT contains(#products, :p)");
    expect(JSON.stringify([input, products])).not.toContain("203.0.113.9");
    // Double opt-in: a confirmation link goes to the address, greeting the person by name.
    expect(confirm.calls.at(-1)?.slice(1, 3)).toEqual([{ kind: "waitlist", firstName: "Ana", country: "the United Kingdom" }, "Ana@Example.com"]);
  });

  it("records the campaign link and drops anything that isn't a plain value", async () => {
    await POST(req({ ...body, campaign: { source: "newsletter", medium: "email", campaign: "uk-launch" } }));
    const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(Object.values(input.ExpressionAttributeValues!)).toContainEqual({ source: "newsletter", medium: "email", campaign: "uk-launch" });
    ddb.resetHistory();
    // A bad campaign value is ignored rather than refusing the sign-up.
    const res = await POST(req({ ...body, campaign: { source: "<script>" } }));
    expect(res.status).toBe(200);
    expect(Object.values(ddb.commandCalls(UpdateCommand)[0]!.args[0].input.ExpressionAttributeNames!)).not.toContain("campaign");
  });

  it("refuses a sign-up without a solved CAPTCHA", async () => {
    const res = await POST(req({ ...body, captcha: "bad" }));
    expect(res.status).toBe(400);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });

  it("requires a first name, since the confirmation email greets the person by it", async () => {
    for (const firstName of [undefined, "", "   "]) {
      const res = await POST(req({ ...body, firstName }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Please add your first name.");
    }
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
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

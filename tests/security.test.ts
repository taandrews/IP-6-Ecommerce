import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { clientIpFrom } from "@/lib/client-ip";
import { products } from "@/content/products";
import { mergeCatalog } from "@/lib/data/merge-catalog";

vi.mock("@/lib/captcha", () => ({ verifyCaptcha: async (v: unknown) => typeof v === "string" && v !== "bad" }));
vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));

process.env.SES_FROM_EMAIL = "orders@ip6.test";
process.env.COGNITO_USER_POOL_ID = "us-east-1_test";
process.env.COGNITO_CLIENT_ID = "client";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);

beforeEach(() => {
  ddb.reset();
  ses.reset();
  ses.on(SendEmailCommand).resolves({ MessageId: "m1" });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const json = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("client IP for rate limits", () => {
  it("takes the visitor CloudFront saw, not anything the visitor wrote", () => {
    // Live Amplify chain: <visitor>, <CloudFront edge>.
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "198.51.100.7, 64.252.74.146" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "10.9.1.1, 203.0.113.1, 198.51.100.7, 64.252.74.146" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "198.51.100.7, 64.252.74.146, 10.0.3.9" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.5" }))).toBe("203.0.113.5");
    expect(clientIpFrom(new Headers(), "fallback")).toBe("fallback");
  });
});

describe("public forms", () => {
  it("drops a contact message whose hidden field a bot filled in", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(json("/api/contact", { name: "Bot", email: "b@example.com", topic: "support", message: "Buy cheap things now", website: "http://spam", captcha: "solved" }));
    expect(res.status).toBe(200);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("opening the privacy link changes nothing; only the button confirms", async () => {
    const { GET, POST } = await import("@/app/api/privacy/verify/route");
    const token = "A".repeat(43);
    const page = await GET(new Request(`http://localhost/api/privacy/verify?id=pr_abcdefgh12&token=${token}`));
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('method="post"');
    expect(ddb.commandCalls(GetCommand)).toHaveLength(0);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);

    ddb.on(GetCommand).resolves({});
    const form = new URLSearchParams({ id: "pr_abcdefgh12", token });
    const res = await POST(new Request("http://localhost/api/privacy/verify", { method: "POST", body: form }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("request=invalid");
    expect(ddb.commandCalls(GetCommand)).toHaveLength(1);
  });
});

describe("catalog from Shopify", () => {
  const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
  const v = supplement.variants[0]!;

  it("takes price, stock and plans from Shopify by SKU", () => {
    const merged = mergeCatalog(products, [
      {
        handle: "ip-6-original",
        availableForSale: true,
        variants: [{ id: "gid://shopify/ProductVariant/1", sku: v.sku, priceCents: 5499, compareAtCents: null, availableForSale: false }],
        sellingPlans: [{ id: "gid://shopify/SellingPlan/9", name: "Deliver every month, 15% off", days: 30, discountPct: 15 }],
      },
    ]);
    const m = merged.find((p) => p.slug === supplement.slug)!;
    expect(m.variants[0]).toMatchObject({ shopifyVariantId: "gid://shopify/ProductVariant/1", inStock: false });
    expect(m.variants[0]!.priceCents.USD).toBe(5499);
    expect(m.subscriptionCycles).toEqual([{ days: 30, discountPct: 15, sellingPlanId: "gid://shopify/SellingPlan/9" }]);
  });

  it("can't sell a variant Shopify doesn't return", () => {
    const m = mergeCatalog(products, []).find((p) => p.slug === supplement.slug)!;
    expect(m.variants[0]).toMatchObject({ inStock: false, shopifyVariantId: undefined });
  });
});

describe("missing CAPTCHA", () => {
  it("gets the 'complete the check' message, not a generic error", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(json("/api/contact", { name: "Ann", email: "ann@example.com", topic: "support", message: "A question about my order.", captcha: null }));
    expect(res.status).toBe(400);
    expect((await res.json()).captcha).toBe(true);
  });
});

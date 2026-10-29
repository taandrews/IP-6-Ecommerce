import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { CognitoIdentityProviderClient, ConfirmSignUpCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { clientIpFrom } from "@/lib/client-ip";
import { canonicalEmail, DISCOUNT_MESSAGES } from "@/lib/pricing/discount";
import { priceLines } from "@/lib/pricing/quote";
import { products } from "@/content/products";
import { mergeCatalog } from "@/lib/data/catalog";
import type { PreorderSettings } from "@/types/records";

vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));

process.env.SES_FROM_EMAIL = "orders@ip6.test";
process.env.COGNITO_USER_POOL_ID = "us-east-1_test";
process.env.COGNITO_CLIENT_ID = "client";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);
const cognito = mockClient(CognitoIdentityProviderClient);

beforeEach(() => {
  ddb.reset();
  ses.reset();
  cognito.reset();
  ses.on(SendEmailCommand).resolves({ MessageId: "m1" });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const json = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("client IP for rate limits", () => {
  it("uses the address CloudFront appended, not one the visitor wrote", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7, 10.0.3.9" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.5" }))).toBe("203.0.113.5");
    expect(clientIpFrom(new Headers(), "fallback")).toBe("fallback");
  });
});

describe("discount codes", () => {
  it("counts +tags, dots and case in Gmail as one customer", () => {
    expect(canonicalEmail("A.Na+promo1@GMAIL.com")).toBe("ana@gmail.com");
    expect(canonicalEmail("ana+2@googlemail.com")).toBe("ana@gmail.com");
    expect(canonicalEmail("a.na+x@example.com")).toBe("a.na@example.com");
  });

  it("never confirms that a guessed code exists", () => {
    const { minimum, ...rest } = DISCOUNT_MESSAGES;
    expect(new Set(Object.values(rest))).toEqual(new Set(["That code isn't valid."]));
    expect(minimum).not.toBe("That code isn't valid.");
  });
});

describe("quantities and stock", () => {
  const off: PreorderSettings = { active: false, discountPct: 0, label: "", shipNote: "" };
  const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
  const v = supplement.variants[0]!;

  it("applies the per-item cap across repeated lines of the same variant", () => {
    const lines = Array.from({ length: 3 }, () => ({ variantId: v.id, qty: 10 }));
    expect(priceLines(products, lines, "USD", off)).toMatchObject({ ok: false, error: { code: "bad_quantity" } });
  });

  it("won't sell more than the stock left", () => {
    const merged = mergeCatalog(products, [], [{ sku: v.sku, stock: 2, lowStockThreshold: 0, updatedAt: "" } as never]);
    expect(priceLines(merged, [{ variantId: v.id, qty: 3 }], "USD", off)).toMatchObject({ ok: false, error: { code: "not_enough_stock" } });
    expect(priceLines(merged, [{ variantId: v.id, qty: 2 }], "USD", off)).toMatchObject({ ok: true });
  });
});

describe("public forms", () => {
  it("drops a contact message whose hidden field a bot filled in", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(json("/api/contact", { name: "Bot", email: "b@example.com", topic: "support", message: "Buy cheap things now", website: "http://spam" }));
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

describe("account enumeration", () => {
  it("answers sign-up the same way for an existing account", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    cognito.on(SignUpCommand).rejects(Object.assign(new Error("An account with the given email already exists."), { name: "UsernameExistsException" }));
    const res = await POST(json("/api/auth/signup", { email: "ana@example.com", password: "Passw0rd!x", name: "Ana" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("never passes Cognito's own wording back from the confirm step", async () => {
    const { POST } = await import("@/app/api/auth/confirm/route");
    cognito.on(ConfirmSignUpCommand).rejects(Object.assign(new Error("User cannot be confirmed. Current status is CONFIRMED"), { name: "NotAuthorizedException" }));
    const res = await POST(json("/api/auth/confirm", { email: "ana@example.com", code: "123456" }));
    expect(JSON.stringify(await res.json())).not.toContain("CONFIRMED");
  });
});

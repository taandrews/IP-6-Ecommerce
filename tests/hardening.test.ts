import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { contentSecurityPolicy, createNonce } from "@/lib/csp";
import { checkFormToken, issueFormToken } from "@/lib/form-token";

const keys = vi.hoisted(() => ({ captcha: { current: "Y3VycmVudC1rZXktY3VycmVudC1rZXktY3VycmVudA==" } as { current: string; previous?: string }, link: null as null | { current: string; previous?: string } }));
vi.mock("@/lib/aws/secrets", () => ({ getFormTokenKey: async () => keys.captcha, getAdminLinkKey: async () => keys.link, getTurnstileSecret: async () => "test-secret" }));
vi.mock("@/lib/aws/ses", () => ({ emailTemplates: { newsletterConfirm: () => ({}), waitlistConfirm: () => ({}) }, sendEmailSafe: vi.fn() }));

const ddb = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddb.reset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("Content-Security-Policy", () => {
  it("runs scripts only with this request's nonce", () => {
    const nonce = createNonce();
    const csp = contentSecurityPolicy(nonce, false);
    const script = csp.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(script).toContain(`'nonce-${nonce}'`);
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it("makes a new nonce every time", () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(Buffer.from(createNonce(), "base64")).toHaveLength(16);
  });
});

describe("CAPTCHA (Cloudflare Turnstile)", () => {
  const req = new Request("https://main.example.amplifyapp.com/api/contact", { method: "POST", headers: { "x-forwarded-for": "198.51.100.7, 64.252.74.146" } });
  const siteverify = (out: unknown, ok = true) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(out), { status: ok ? 200 : 500 }));

  it("asks Cloudflare with our secret, the token and the visitor's real IP", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    const spy = siteverify({ success: true, hostname: "localhost" });
    expect(await verifyCaptcha("tok", req)).toBe(true);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = new URLSearchParams(String((init as RequestInit).body));
    expect(Object.fromEntries(body)).toEqual({ secret: "test-secret", response: "tok", remoteip: "198.51.100.7" });
    spy.mockRestore();
  });

  it("refuses what Cloudflare refuses (a used or expired token), and missing tokens without asking", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    const spy = siteverify({ success: false, "error-codes": ["timeout-or-duplicate"] });
    expect(await verifyCaptcha("used", req)).toBe(false);
    expect(await verifyCaptcha(undefined, req)).toBe(false);
    expect(await verifyCaptcha("", req)).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("fails closed when Cloudflare can't be reached", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    expect(await verifyCaptcha("tok", req)).toBe(false);
    spy.mockRestore();
    const bad = siteverify({}, false);
    expect(await verifyCaptcha("tok", req)).toBe(false);
    bad.mockRestore();
  });

  it("in production, refuses a token issued for another site", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    vi.stubEnv("NODE_ENV", "production");
    const spy = siteverify({ success: true, hostname: "evil.example" });
    expect(await verifyCaptcha("tok", req)).toBe(false);
    spy.mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "ip6original.com" })));
    expect(await verifyCaptcha("tok", req)).toBe(true);
    spy.mockRestore();
    vi.unstubAllEnvs();
  });
});

describe("sign-up form tokens", () => {
  it("only work for the address they were issued for, and across a rotation", () => {
    const t = issueFormToken("k1", "ana@example.com");
    expect(checkFormToken(["k1"], "ana@example.com", t)).toBe(true);
    expect(checkFormToken(["k1"], "bob@example.com", t)).toBe(false);
    expect(checkFormToken(["k2"], "ana@example.com", t)).toBe(false);
    expect(checkFormToken(["k2", "k1"], "ana@example.com", t)).toBe(true);
    expect(checkFormToken(["k1"], "ana@example.com", `1.${t.split(".")[1]}`)).toBe(false);
  });
});

describe("admin link sealing", () => {
  it("opens links sealed with the key before a rotation", async () => {
    const seal = await import("@/lib/admin/seal");
    const a = Buffer.alloc(32, 1).toString("base64");
    const b = Buffer.alloc(32, 2).toString("base64");
    keys.link = { current: a };
    await seal.loadLinkKey();
    const token = seal.sealEmail("ana@example.com");
    keys.link = { current: b, previous: a };
    await seal.loadLinkKey();
    expect(seal.unsealEmail(token)).toBe("ana@example.com");
    keys.link = { current: b };
    await seal.loadLinkKey();
    expect(seal.unsealEmail(token)).toBeNull();
  });
});

describe("double opt-in links", () => {
  it("confirm once and clear the pending expiry", async () => {
    const { confirmSignup } = await import("@/lib/data/confirmations");
    ddb.on(GetCommand).resolves({ Item: { kind: "newsletter", email: "ana@example.com", consentVersion: "2026-10-29", expiresAt: Math.floor(Date.now() / 1000) + 600 } });
    ddb.on(DeleteCommand).resolvesOnce({}).rejects(Object.assign(new Error("gone"), { name: "ConditionalCheckFailedException" }));
    ddb.on(UpdateCommand).resolves({});
    expect(await confirmSignup("t".repeat(43))).toBe("newsletter");
    const update = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(update.Key).toEqual({ userId: "newsletter_ana@example.com" });
    expect(update.UpdateExpression).toContain("REMOVE #un, #exp");
    expect(update.ExpressionAttributeValues![":cv"]).toBe("2026-10-29");
    expect(await confirmSignup("t".repeat(43))).toBeNull();
  });

  it("refuse an expired link", async () => {
    const { confirmSignup } = await import("@/lib/data/confirmations");
    ddb.on(GetCommand).resolves({ Item: { kind: "waitlist", email: "ana@example.com", expiresAt: Math.floor(Date.now() / 1000) - 1 } });
    expect(await confirmSignup("t".repeat(43))).toBeNull();
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });
});

describe("redirects", () => {
  it("use the public site address, not Amplify's internal request URL", async () => {
    const { siteUrl } = await import("@/lib/site-url");
    const internal = new Request("https://localhost:3000/api/auth/signout", { method: "POST" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://main.example.amplifyapp.com";
    expect(siteUrl("/account/login", internal).toString()).toBe("https://main.example.amplifyapp.com/account/login");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl("/", internal).origin).toBe("https://localhost:3000");
  });
});

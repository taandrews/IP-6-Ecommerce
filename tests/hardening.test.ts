import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createChallenge, solveChallenge } from "altcha-lib";
import { contentSecurityPolicy, createNonce } from "@/lib/csp";
import { checkFormToken, issueFormToken } from "@/lib/form-token";

const keys = vi.hoisted(() => ({ captcha: { current: "Y3VycmVudC1rZXktY3VycmVudC1rZXktY3VycmVudA==" } as { current: string; previous?: string }, link: null as null | { current: string; previous?: string } }));
vi.mock("@/lib/aws/secrets", () => ({ getCaptchaKey: async () => keys.captcha, getAdminLinkKey: async () => keys.link }));
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

describe("CAPTCHA", () => {
  const solve = async (hmacKey: string) => {
    const c = await createChallenge({ hmacKey, maxnumber: 2000, expires: new Date(Date.now() + 60_000) });
    const s = await solveChallenge(c.challenge, c.salt, c.algorithm, c.maxnumber).promise;
    return Buffer.from(JSON.stringify({ ...c, number: s!.number })).toString("base64");
  };

  it("accepts a solved puzzle once, then refuses the same answer", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    const payload = await solve(keys.captcha.current);
    ddb.on(PutCommand).resolvesOnce({}).rejects(Object.assign(new Error("exists"), { name: "ConditionalCheckFailedException" }));
    expect(await verifyCaptcha(payload)).toBe(true);
    expect(await verifyCaptcha(payload)).toBe(false);
  });

  it("refuses a puzzle signed with someone else's key, and junk", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    ddb.on(PutCommand).resolves({});
    expect(await verifyCaptcha(await solve("not-our-key"))).toBe(false);
    expect(await verifyCaptcha("not base64 json")).toBe(false);
    expect(await verifyCaptcha(undefined)).toBe(false);
  });

  it("still accepts a puzzle signed just before the key rotated", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    const old = keys.captcha.current;
    const payload = await solve(old);
    keys.captcha = { current: "bmV3LWtleS1uZXcta2V5LW5ldy1rZXktbmV3LWtleQ==", previous: old };
    ddb.on(PutCommand).resolves({});
    expect(await verifyCaptcha(payload)).toBe(true);
    keys.captcha = { current: old };
  });

  it("fails closed when it can't record that a puzzle was used", async () => {
    const { verifyCaptcha } = await import("@/lib/captcha");
    ddb.on(PutCommand).rejects(new Error("throttled"));
    expect(await verifyCaptcha(await solve(keys.captcha.current))).toBe(false);
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

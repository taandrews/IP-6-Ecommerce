import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));
vi.mock("@/lib/captcha", () => ({ verifyCaptcha: async (v: unknown) => v === "solved" }));
const confirm = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/lib/data/confirmations", () => ({ requestConfirmation: async (...a: unknown[]) => { confirm.calls.push(a); } }));
const session = vi.hoisted(() => ({ user: null as null | { email: string; emailVerified: boolean } }));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => session.user }));

const ddb = mockClient(DynamoDBDocumentClient);
const { POST } = await import("@/app/api/newsletter/route");

const req = (b: unknown) => new Request("http://localhost/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
const updates = () => ddb.commandCalls(UpdateCommand).map((c) => c.args[0].input);
const conditional = () => Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
const quiz = { intent: "research", experience: "new", values: "purity", goal: "immune", routine: "daily", age: "50-64" };

beforeEach(() => {
  ddb.reset();
  ddb.on(UpdateCommand).resolves({});
  ddb.on(GetCommand).resolves({});
  session.user = null;
  confirm.calls = [];
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("newsletter sign-up (double opt-in)", () => {
  it("saves a new sign-up as pending, emails the link and returns a token for the quiz", async () => {
    const res = await POST(req({ email: "Ana@Example.com", consent: true, source: "prebook_popup", quiz: { intent: "research" }, captcha: "solved" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toMatch(/^\d+\./);
    const [signup, answers] = updates();
    expect(signup!.Key).toEqual({ userId: "newsletter_ana@example.com" });
    // Not on the list until the link is clicked, and it expires if nobody does.
    expect(signup!.UpdateExpression).toContain("#nl = if_not_exists(#nl, :f)");
    expect(signup!.ExpressionAttributeValues![":f"]).toBe(false);
    expect(signup!.UpdateExpression).toContain("#exp = :exp");
    expect(confirm.calls[0]!.slice(1)).toEqual(["newsletter", "Ana@Example.com", "2026-10-29"]);
    expect(answers!.ExpressionAttributeValues![":quiz"]).toEqual({ intent: "research" });
  });

  it("refuses a new sign-up without a solved CAPTCHA", async () => {
    const res = await POST(req({ email: "ana@example.com", consent: true, captcha: "nope" }));
    expect(res.status).toBe(400);
    expect((await res.json()).captcha).toBe(true);
    expect(updates()).toHaveLength(0);
  });

  it("lets the quiz add answers with the token, without another CAPTCHA or email", async () => {
    const first = await (await POST(req({ email: "ana@example.com", consent: true, captcha: "solved" }))).json();
    ddb.resetHistory();
    confirm.calls = [];
    const res = await POST(req({ email: "ana@example.com", consent: true, quiz, token: first.token }));
    expect(res.status).toBe(200);
    expect(updates()).toHaveLength(1);
    expect(updates()[0]!.ExpressionAttributeValues![":quiz"]).toEqual(quiz);
    expect(confirm.calls).toHaveLength(0);
  });

  it("won't accept a token issued for another address", async () => {
    const first = await (await POST(req({ email: "ana@example.com", consent: true, captcha: "solved" }))).json();
    const res = await POST(req({ email: "victim@example.com", consent: true, quiz, token: first.token }));
    expect(res.status).toBe(400);
  });

  it("doesn't email or change a confirmed subscriber, and keeps their answers", async () => {
    ddb.on(GetCommand).resolves({ Item: { userId: "newsletter_ana@example.com", newsletter: true } });
    ddb.on(UpdateCommand).rejects(conditional());
    const res = await POST(req({ email: "ana@example.com", consent: true, quiz, captcha: "solved" }));
    expect(res.status).toBe(200);
    expect(confirm.calls).toHaveLength(0);
    expect(updates()).toHaveLength(1);
    expect(updates()[0]!.ConditionExpression).toContain("#nl <> :t OR attribute_not_exists(#quiz)");
  });

  it("keeps an opt-out marker from expiring and only emails the owner a link", async () => {
    ddb.on(GetCommand).resolves({ Item: { userId: "newsletter_ana@example.com", newsletter: false, unsubscribedAt: "2026-10-01" } });
    await POST(req({ email: "ana@example.com", consent: true, captcha: "solved" }));
    expect(updates()[0]!.UpdateExpression).not.toContain("#exp");
    expect(confirm.calls).toHaveLength(1);
  });

  it("confirms at once for someone signed in with that verified email", async () => {
    session.user = { email: "ana@example.com", emailVerified: true };
    await POST(req({ email: "ana@example.com", consent: true, source: "footer", captcha: "solved" }));
    const [signup] = updates();
    expect(signup!.ExpressionAttributeValues![":t"]).toBe(true);
    expect(signup!.UpdateExpression).toContain("REMOVE #un, #exp");
    expect(confirm.calls).toHaveLength(0);
  });

  it("rejects answers that aren't in the quiz", async () => {
    expect((await POST(req({ email: "a@example.com", consent: true, captcha: "solved", quiz: { goal: "cure-cancer" } }))).status).toBe(400);
    expect((await POST(req({ email: "a@example.com", consent: true, captcha: "solved", quiz: { shoeSize: "9" } }))).status).toBe(400);
    expect(updates()).toHaveLength(0);
  });

  it("requires the consent box", async () => {
    expect((await POST(req({ email: "a@example.com", captcha: "solved", quiz: { intent: "family" } }))).status).toBe(400);
  });
});

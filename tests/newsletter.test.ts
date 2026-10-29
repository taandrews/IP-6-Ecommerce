import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));
const session = vi.hoisted(() => ({ user: null as null | { email: string; emailVerified: boolean } }));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => session.user }));

const ddb = mockClient(DynamoDBDocumentClient);
const { POST } = await import("@/app/api/newsletter/route");

const req = (b: unknown) => new Request("http://localhost/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
const call = (i: number) => {
  const input = ddb.commandCalls(UpdateCommand)[i]!.args[0].input;
  return {
    input,
    fields: Object.fromEntries(
      Object.entries(input.ExpressionAttributeNames!).map(([ph, name]) => [name, input.ExpressionAttributeValues![ph.replace("#", ":")]]),
    ),
  };
};
const conditional = () => Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });

beforeEach(() => {
  ddb.reset();
  ddb.on(UpdateCommand).resolves({});
  session.user = null;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("newsletter and pre-order quiz", () => {
  it("saves the sign-up, then the quiz answers, keeping the first proof of consent", async () => {
    const quiz = { intent: "research", experience: "new", values: "purity", goal: "immune", routine: "daily", age: "50-64" };
    const res = await POST(req({ email: "Ana@Example.com", consent: true, source: "prebook_popup", quiz }));
    expect(res.status).toBe(200);
    const signup = call(0);
    expect(signup.input.Key).toEqual({ userId: "newsletter_ana@example.com" });
    expect(signup.fields).toMatchObject({ email: "ana@example.com", newsletter: true, source: "prebook_popup", consentVersion: "2026-10-29" });
    expect(signup.input.UpdateExpression).toContain("if_not_exists(#ca, :now)");
    expect(signup.input.UpdateExpression).toContain("if_not_exists(#cr, :now)");
    // Someone who unsubscribed can't be signed up again by a stranger.
    expect(signup.input.ConditionExpression).toBe("attribute_not_exists(#nl) OR #nl = :nl");
    const answers = call(1);
    expect(answers.input.ExpressionAttributeValues![":quiz"]).toEqual(quiz);
    // Answers only go onto a row signed up in the last few minutes.
    expect(answers.input.ConditionExpression).toContain("#cr > :recent");
  });

  it("saves an email without answers and leaves earlier answers alone", async () => {
    await POST(req({ email: "ana@example.com", consent: true, source: "footer" }));
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
    const { input, fields } = call(0);
    expect(input.UpdateExpression).not.toContain("#quiz");
    expect(fields.consentVersion).toBe("2026-10-20");
  });

  it("gives the same reply when the address unsubscribed and the request isn't from them", async () => {
    ddb.on(UpdateCommand).rejects(conditional());
    const res = await POST(req({ email: "ana@example.com", consent: true, quiz: { intent: "family" } }));
    expect(res.status).toBe(200);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  it("keeps older quiz answers when someone else types the address later", async () => {
    ddb.on(UpdateCommand).resolvesOnce({}).rejects(conditional());
    const res = await POST(req({ email: "ana@example.com", consent: true, quiz: { intent: "family" } }));
    expect(res.status).toBe(200);
  });

  it("lets a signed-in person with that verified email sign up again after unsubscribing", async () => {
    session.user = { email: "ana@example.com", emailVerified: true };
    await POST(req({ email: "ana@example.com", consent: true, source: "footer" }));
    const { input } = call(0);
    expect(input.ConditionExpression).toBeUndefined();
    expect(input.UpdateExpression).toContain("#ca = :now");
  });

  it("rejects answers that aren't in the quiz", async () => {
    expect((await POST(req({ email: "a@example.com", consent: true, quiz: { goal: "cure-cancer" } }))).status).toBe(400);
    expect((await POST(req({ email: "a@example.com", consent: true, quiz: { shoeSize: "9" } }))).status).toBe(400);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });

  it("requires the consent box", async () => {
    expect((await POST(req({ email: "a@example.com", quiz: { intent: "family" } }))).status).toBe(400);
  });
});

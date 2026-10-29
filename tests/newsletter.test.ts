import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = mockClient(DynamoDBDocumentClient);
const { POST } = await import("@/app/api/newsletter/route");

const req = (b: unknown) => new Request("http://localhost/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
const saved = () => {
  const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
  return {
    input,
    fields: Object.fromEntries(
      Object.entries(input.ExpressionAttributeNames!).map(([ph, name]) => [name, input.ExpressionAttributeValues![ph.replace("#", ":")]]),
    ),
  };
};

beforeEach(() => {
  ddb.reset();
  ddb.on(UpdateCommand).resolves({});
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("newsletter and pre-order quiz", () => {
  it("saves the quiz answers with the sign-up and keeps the first sign-up date", async () => {
    const quiz = { intent: "research", experience: "new", values: "purity", goal: "immune", routine: "daily", age: "50-64" };
    const res = await POST(req({ email: "Ana@Example.com", consent: true, source: "prebook_popup", quiz }));
    expect(res.status).toBe(200);
    const { input, fields } = saved();
    expect(input.Key).toEqual({ userId: "newsletter_ana@example.com" });
    expect(fields).toMatchObject({ email: "ana@example.com", newsletter: true, source: "prebook_popup", consentVersion: "2026-10-29", quiz });
    expect(input.UpdateExpression).toContain("if_not_exists(#cr, :now)");
  });

  it("saves an email without answers and leaves earlier answers alone", async () => {
    await POST(req({ email: "ana@example.com", consent: true, source: "footer" }));
    const { input, fields } = saved();
    expect(input.UpdateExpression).not.toContain("#quiz");
    expect(fields.consentVersion).toBe("2026-10-20");
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

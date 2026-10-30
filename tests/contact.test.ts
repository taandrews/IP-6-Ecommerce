import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

vi.mock("@/lib/captcha", () => ({ verifyCaptcha: async (v: unknown) => v !== "bad", captchaKeys: async () => ["test-key"], newChallenge: async () => ({}) }));
vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));

process.env.SES_FROM_EMAIL = "orders@ip6.test";

const ses = mockClient(SESClient);
const { POST } = await import("@/app/api/contact/route");

function post(topic: string) {
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ann", email: "ann@example.com", topic, message: "A question about my order.", altcha: "solved" }),
    }),
  );
}

describe("contact form routing", () => {
  beforeEach(() => ses.reset());

  it.each([
    ["support", "support@ip6original.com"],
    ["order", "support@ip6original.com"],
    ["wholesale", "wholesale@ip6original.com"],
    ["press", "press@ip6original.com"],
    ["other", "hello@ip6original.com"],
  ])("%s goes to %s, reply goes to the customer", async (topic, inbox) => {
    const res = await post(topic);
    expect(res.status).toBe(200);
    const sent = ses.commandCalls(SendEmailCommand)[0]!.args[0].input;
    expect(sent.Destination?.ToAddresses).toEqual([inbox]);
    expect(sent.ReplyToAddresses).toEqual(["ann@example.com"]);
    expect(sent.Source).toBe("IP6 Original contact form <hello@ip6.test>");
  });

  it("rejects an unknown topic", async () => {
    expect((await post("billing")).status).toBe(400);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("reports a failed send instead of claiming success", async () => {
    ses.on(SendEmailCommand).rejects(new Error("throttled"));
    expect((await post("support")).status).toBe(502);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { OrderRecord } from "@/types/records";
import { TABLES } from "@/lib/aws/dynamo";

vi.mock("@/lib/aws/secrets", () => ({ getFormTokenKey: async () => ({ current: "test-key" }) }));
process.env.SES_FROM_EMAIL = "orders@ip6.test";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);
const { sendCartReminder, checkRestoreToken, checkUnsubscribeToken, cartRemindersEnabled } = await import("@/lib/cart-reminder");

const order = {
  orderId: "IP6-ABANDON123",
  status: "cancelled",
  cancelReason: "checkout_expired",
  createdAt: "2026-11-05T10:00:00.000Z",
  email: "Jane@Example.com",
  emailKey: "jane@example.com",
  customerName: "Jane Doe",
  currency: "USD",
  items: [{ sku: "SUP-IP6-CAP240", variantId: "sup-capsule-240", name: "IP6 Original Supplement", variantLabel: "240", qty: 1, unitPriceCents: 4999, discountPct: 15, lineTotalCents: 4249, preorder: true }],
  cartReminder: true,
} as unknown as OrderRecord;

beforeEach(() => {
  ddb.reset();
  ses.reset();
  vi.stubEnv("BUSINESS_POSTAL_ADDRESS", "PO Box 1, Lutherville, MD 21093");
  ddb.on(GetCommand).resolves({});
  ddb.on(QueryCommand).resolves({ Items: [] });
  ddb.on(PutCommand).resolves({});
  ddb.on(UpdateCommand).resolves({});
  ses.on(SendEmailCommand).resolves({ MessageId: "m1" });
});
afterEach(() => vi.unstubAllEnvs());

describe("cart reminder", () => {
  it("sends one email with a signed cart link, an opt-out link and the postal address", async () => {
    expect(await sendCartReminder(order, "https://ip6original.com")).toBe("sent");
    const mail = ses.commandCalls(SendEmailCommand)[0]!.args[0].input;
    const html = mail.Message!.Body!.Html!.Data!;
    expect(mail.Destination!.ToAddresses).toEqual(["Jane@Example.com"]);
    expect(html).toContain("Hi Jane,");
    expect(html).toContain("PO Box 1, Lutherville, MD 21093");
    const restore = new URL(html.match(/href="(https:\/\/ip6original\.com\/cart\/restore[^"]+)"/)![1]!.replace(/&amp;/g, "&"));
    expect(await checkRestoreToken(restore.searchParams.get("o")!, restore.searchParams.get("t"))).toBe(true);
    expect(await checkRestoreToken("IP6-OTHER0000", restore.searchParams.get("t"))).toBe(false);
    const unsub = new URL(html.match(/href="(https:\/\/ip6original\.com\/cart\/reminders[^"]+)"/)![1]!.replace(/&amp;/g, "&"));
    expect(await checkUnsubscribeToken("jane@example.com", unsub.searchParams.get("t"))).toBe(true);
    // One a day: the slot is a conditional write, and the order records that it was sent.
    const slot = ddb.commandCalls(PutCommand).map((c) => c.args[0].input).find((i) => i.TableName === TABLES.RateLimits)!;
    expect(slot.ConditionExpression).toBe("attribute_not_exists(#k)");
    expect(JSON.stringify(slot.Item)).not.toContain("jane");
    expect(JSON.stringify(ddb.commandCalls(UpdateCommand)[0]!.args[0].input.ExpressionAttributeNames)).toContain("cartReminderSentAt");
  });

  it("is off, and offered nowhere, until a postal address is configured", async () => {
    vi.stubEnv("BUSINESS_POSTAL_ADDRESS", "");
    expect(cartRemindersEnabled()).toBe(false);
    expect(await sendCartReminder(order, "https://ip6original.com")).toBe("disabled");
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("never sends without the shopper's opt-in, after an opt-out, or after they've bought", async () => {
    expect(await sendCartReminder({ ...order, cartReminder: undefined }, "https://ip6original.com")).toBe("not_requested");
    ddb.on(GetCommand, { TableName: TABLES.Users }).resolves({ Item: { optedOutAt: "2026-11-01" } });
    expect(await sendCartReminder(order, "https://ip6original.com")).toBe("opted_out");
    ddb.on(GetCommand).resolves({});
    ddb.on(QueryCommand).resolves({ Items: [{ orderId: "IP6-PAIDLATER1", status: "paid", createdAt: "2026-11-05T11:00:00.000Z" }] });
    expect(await sendCartReminder(order, "https://ip6original.com")).toBe("bought_since");
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("sends at most one a day, and frees the day's slot if the email fails", async () => {
    ddb.on(PutCommand, { TableName: TABLES.RateLimits }).rejects(Object.assign(new Error("exists"), { name: "ConditionalCheckFailedException" }));
    expect(await sendCartReminder(order, "https://ip6original.com")).toBe("already_today");
    ddb.on(PutCommand).resolves({});
    ses.on(SendEmailCommand).rejects(new Error("ses down"));
    await expect(sendCartReminder(order, "https://ip6original.com")).rejects.toThrow();
    expect(ddb.commandCalls(DeleteCommand)).toHaveLength(1);
  });
});

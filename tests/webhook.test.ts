import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type Stripe from "stripe";
import type { OrderRecord } from "@/types/records";

vi.mock("next/cache", () => ({ revalidateTag: () => undefined, unstable_cache: (fn: () => unknown) => fn }));

process.env.SES_FROM_EMAIL = "orders@ip6.test";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);
const { handlePaymentSucceeded } = await import("@/lib/orders/events");

const order: OrderRecord = {
  orderId: "IP6-TESTORDER1",
  status: "pending",
  createdAt: "2026-10-20T00:00:00.000Z",
  updatedAt: "2026-10-20T00:00:00.000Z",
  email: "jane@example.com",
  emailKey: "jane@example.com",
  customerName: "Jane Doe",
  shippingAddress: { name: "Jane Doe", line1: "1 Main", city: "Towson", region: "MD", postalCode: "21204", country: "US" },
  items: [{ sku: "SUP-IP6-CAP240", variantId: "sup-capsule-240", name: "IP6 Original", variantLabel: "240", qty: 1, unitPriceCents: 4900, discountPct: 15, lineTotalCents: 4165, preorder: true }],
  currency: "USD",
  subtotalCents: 4165,
  discountCents: 0,
  shippingRateId: "standard",
  shippingLabel: "Standard",
  shippingCents: 727,
  taxCents: 0,
  totalCents: 4892,
  preorder: "1",
  stripePaymentIntentId: "pi_123",
  refundedCents: 0,
  refunds: [],
  notes: [],
};

const stripe = { tax: { transactions: { createFromCalculation: vi.fn() } } } as unknown as Stripe;
const pi = { id: "pi_123", amount: 4892, metadata: { orderId: order.orderId }, customer: null, payment_method: "pm_1" } as unknown as Stripe.PaymentIntent;

beforeEach(() => {
  ddb.reset();
  ses.reset();
  ddb.on(GetCommand).resolves({ Item: order });
  ddb.on(ScanCommand).resolves({ Items: [] });
  ddb.on(PutCommand).resolves({});
  ses.on(SendEmailCommand).resolves({ MessageId: "m1" });
});

describe("payment_intent.succeeded", () => {
  it("marks the order paid, takes stock, records the sale and emails the customer once", async () => {
    ddb.on(UpdateCommand).resolves({});
    await handlePaymentSucceeded(stripe, pi);
    const updates = ddb.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    expect(updates[0]!.ConditionExpression).toContain("#s = :pending");
    expect(updates[0]!.ExpressionAttributeValues![":amt"]).toBe(4892);
    expect(updates.some((u) => String(u.UpdateExpression).includes("stock = stock - :q"))).toBe(true);
    expect(updates.some((u) => String(u.TableName).endsWith("AnalyticsDaily"))).toBe(true);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
    const sent = ses.commandCalls(SendEmailCommand)[0]!.args[0].input;
    expect(sent.Source).toBe("IP6 Original <orders@ip6.test>");
    expect(sent.ReplyToAddresses).toEqual(["support@ip6original.com"]);
  });

  it("does nothing on a retried event (already paid)", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    ddb.on(GetCommand).resolves({ Item: { ...order, status: "paid" } });
    ddb.on(UpdateCommand).rejects(err);
    await handlePaymentSucceeded(stripe, pi);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  it("refuses to fulfil when the paid amount doesn't match the order", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    ddb.on(UpdateCommand).rejectsOnce(err).resolves({});
    await handlePaymentSucceeded(stripe, { ...pi, amount: 1 } as Stripe.PaymentIntent);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
    const note = ddb.commandCalls(UpdateCommand)[1]?.args[0].input;
    expect(JSON.stringify(note?.ExpressionAttributeValues)).toContain("did not match");
  });
});

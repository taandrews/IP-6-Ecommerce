import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, ScanCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type Stripe from "stripe";
import type { OrderRecord } from "@/types/records";

vi.mock("next/cache", () => ({ revalidateTag: () => undefined, unstable_cache: (fn: () => unknown) => fn }));

process.env.SES_FROM_EMAIL = "orders@ip6.test";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);
const { handlePaymentSucceeded, fulfillCheckoutSession, closeUnpaidCheckout } = await import("@/lib/orders/events");

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
  ddb.on(TransactWriteCommand).resolves({});
  // Inventory: the SKU is tracked at one location with a lot, and the checkout held 1 unit.
  ddb.on(QueryCommand).callsFake((input: { ExpressionAttributeValues?: Record<string, string> }) => {
    const p = input.ExpressionAttributeValues?.[":p"] ?? "";
    if (p === "LOC") return { Items: [{ pk: "LOC", sk: "loc_a1b2c3d4e5f6", locationId: "loc_a1b2c3d4e5f6", name: "US", countries: ["US"], priority: 1, active: true }] };
    if (p.startsWith("SKU#")) return { Items: [
      { pk: p, sk: "POS#loc_a1b2c3d4e5f6", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", onHand: 10, reserved: 1, available: 9, safetyStock: 0, lowStockThreshold: 0, backorderLimit: 0 },
      { pk: p, sk: "LOT#loc_a1b2c3d4e5f6#L1", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "L1", onHand: 10, expiresOn: "2099-01-01" },
    ] };
    if (p.startsWith("HOLD#")) return { Items: [{ pk: p, sk: "SUP-IP6-CAP240#loc_a1b2c3d4e5f6", orderId: "IP6-TESTORDER1", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", qty: 1 }] };
    return { Items: [] };
  });
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
    // Stock: the hold becomes a sale from lot L1, logged, in one transaction.
    const sale = ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
    expect(sale.some((i) => i.Put?.Item?.type === "sale" && i.Put.Item.lotNo === "L1")).toBe(true);
    expect(updates.some((u) => String(u.TableName).endsWith("AnalyticsDaily"))).toBe(true);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
    const sent = ses.commandCalls(SendEmailCommand)[0]!.args[0].input;
    expect(sent.Source).toBe("IP6 Original <orders@ip6.test>");
    expect(sent.ReplyToAddresses).toEqual(["support@ip6original.com"]);
  });

  it("does nothing on a retried event once every step is done", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    const done = new Set(["stock", "sale", "subscriptions", "email"]);
    ddb.on(GetCommand).resolves({ Item: { ...order, status: "paid", doneSteps: done } });
    ddb.on(UpdateCommand).rejects(err);
    await handlePaymentSucceeded(stripe, pi);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  it("finishes the steps a failed delivery left undone, without repeating the others", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    ddb.on(GetCommand).resolves({ Item: { ...order, status: "paid", doneSteps: new Set(["stock", "sale"]) } });
    // markPaid fails (already paid); the step lease, step markers and lease release succeed.
    ddb.on(UpdateCommand).rejectsOnce(err).resolves({});
    await handlePaymentSucceeded(stripe, pi);
    const updates = ddb.commandCalls(UpdateCommand).map((c) => String(c.args[0].input.UpdateExpression));
    expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
    expect(updates.filter((u) => u.includes("ADD doneSteps"))).toHaveLength(2);
  });

  it("leaves the work to the delivery that already holds the lease", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    ddb.on(GetCommand).resolves({ Item: { ...order, status: "paid" } });
    ddb.on(UpdateCommand).rejects(err);
    await handlePaymentSucceeded(stripe, pi);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("refunds a payment whose unpaid order already expired", async () => {
    const refunds = vi.fn().mockResolvedValue({ id: "re_1" });
    ddb.on(GetCommand).resolves({});
    await handlePaymentSucceeded({ ...stripe, refunds: { create: refunds } } as unknown as Stripe, pi);
    expect(refunds).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: "pi_123" }), { idempotencyKey: "orphan-pi_123" });
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("refuses to fulfil when the paid amount doesn't match the order", async () => {
    const err = Object.assign(new Error("conditional"), { name: "ConditionalCheckFailedException" });
    ddb.on(UpdateCommand).rejectsOnce(err).resolves({});
    await handlePaymentSucceeded(stripe, { ...pi, amount: 1 } as Stripe.PaymentIntent);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
    const note = ddb.commandCalls(UpdateCommand)[1]?.args[0].input;
    expect(JSON.stringify(note?.ExpressionAttributeValues)).toContain("did not match");
  });

  it("refunds and cancels, without fulfilling, when the address is outside the countries we sell to", async () => {
    ddb.on(UpdateCommand).resolves({});
    ddb.on(GetCommand).resolves({ Item: { ...order, shippingAddress: { ...order.shippingAddress, country: "GB", region: "", postalCode: "SW1A 1AA" } } });
    const refunds = { create: vi.fn().mockResolvedValue({ id: "re_1" }) };
    await handlePaymentSucceeded({ ...stripe, refunds } as unknown as Stripe, pi);
    expect(refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_123", metadata: expect.objectContaining({ by: "system" }) }),
      { idempotencyKey: `not-sellable-${order.orderId}` },
    );
    const updates = ddb.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    expect(updates[0]!.ExpressionAttributeValues![":s"]).toBe("cancelled");
    expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(updates.some((u) => String(u.TableName).endsWith("AnalyticsDaily"))).toBe(false);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("also refuses a US order whose address is a territory or APO", async () => {
    ddb.on(UpdateCommand).resolves({});
    ddb.on(GetCommand).resolves({ Item: { ...order, shippingAddress: { ...order.shippingAddress, city: "APO", region: "AE", postalCode: "09012" } } });
    const refunds = { create: vi.fn().mockResolvedValue({ id: "re_2" }) };
    await handlePaymentSucceeded({ ...stripe, refunds } as unknown as Stripe, pi);
    expect(refunds.create).toHaveBeenCalledTimes(1);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });
});

describe("Checkout Session events", () => {
  const session = (over: Partial<Stripe.Checkout.Session> = {}) =>
    ({ id: "cs_1", mode: "payment", payment_status: "paid", status: "complete", payment_intent: "pi_123", metadata: { orderId: order.orderId }, ...over }) as Stripe.Checkout.Session;
  const withPi = { ...stripe, paymentIntents: { retrieve: vi.fn(async () => pi) } } as unknown as Stripe;

  it("fulfils a paid session through its own order, matching the session id and amount", async () => {
    ddb.on(GetCommand).resolves({ Item: { ...order, stripePaymentIntentId: "", stripeCheckoutSessionId: "cs_1" } });
    ddb.on(UpdateCommand).resolves({});
    await fulfillCheckoutSession(withPi, session());
    const paid = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(paid.ConditionExpression).toContain("stripeCheckoutSessionId = :cs");
    expect(paid.ExpressionAttributeValues).toMatchObject({ ":cs": "cs_1", ":pi": "pi_123", ":amt": 4892 });
    expect(paid.UpdateExpression).toContain("stripePaymentIntentId = :pi");
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
  });

  it("waits for a bank debit to clear before fulfilling, keeping its stock held meanwhile", async () => {
    ddb.on(UpdateCommand).resolves({});
    await fulfillCheckoutSession(withPi, session({ payment_status: "unpaid" }));
    // The only write extends the stock hold; nothing is marked paid, sold or emailed.
    const updates = ddb.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    expect(updates).toHaveLength(1);
    expect(updates[0]!.UpdateExpression).toBe("SET holdUntil = :u");
    expect(new Date(String(updates[0]!.ExpressionAttributeValues![":u"])).getTime()).toBeGreaterThan(Date.now() + 9 * 86400000);
    expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("closes an expired or failed checkout's pending order and frees its discount code", async () => {
    ddb.on(GetCommand).resolves({ Item: { ...order, discountCode: "WELCOME10", stripeCheckoutSessionId: "cs_1" } });
    ddb.on(UpdateCommand).resolves({});
    await closeUnpaidCheckout(session({ status: "expired", payment_status: "unpaid" }), "checkout_expired");
    const first = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(first.ExpressionAttributeValues).toMatchObject({ ":s": "cancelled" });
    expect(JSON.stringify(first.ExpressionAttributeValues)).toContain("checkout_expired");
  });

  it("never closes an order that belongs to another session or is already paid", async () => {
    ddb.on(GetCommand).resolves({ Item: { ...order, status: "paid", stripeCheckoutSessionId: "cs_1" } });
    await closeUnpaidCheckout(session(), "checkout_expired");
    ddb.on(GetCommand).resolves({ Item: { ...order, stripeCheckoutSessionId: "cs_other" } });
    await closeUnpaidCheckout(session(), "checkout_expired");
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
  });
});

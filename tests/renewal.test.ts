import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type Stripe from "stripe";
import type { OrderRecord, SubscriptionRecord } from "@/types/records";
import { TABLES } from "@/lib/aws/dynamo";

vi.mock("next/cache", () => ({ revalidateTag: () => undefined, unstable_cache: (fn: () => unknown) => fn }));
process.env.SES_FROM_EMAIL = "orders@ip6.test";

const ddb = mockClient(DynamoDBDocumentClient);
const ses = mockClient(SESClient);
const { handleRenewalPaid, handleRenewalFailed } = await import("@/lib/orders/events");

const record: SubscriptionRecord = {
  subscriptionId: "sub_1",
  status: "active",
  email: "jane@example.com",
  emailKey: "jane@example.com",
  stripeCustomerId: "cus_1",
  sku: "SUP-IP6-CAP240",
  variantId: "sup-capsule-240",
  productName: "IP6 Original Supplement",
  cycleDays: 30,
  priceCents: 4249,
  currency: "USD",
  orderId: "IP6-FIRSTORDER",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};
const firstOrder = {
  orderId: "IP6-FIRSTORDER",
  customerName: "Jane Doe",
  shippingAddress: { name: "Jane Doe", line1: "1 Main", city: "Towson", region: "MD", postalCode: "21204", country: "US" },
} as OrderRecord;

/** A renewal invoice in the shape of Stripe API 2026-10-28 (parent, pricing, total_taxes; no subscription/payment_intent fields). */
const invoice = {
  id: "in_1",
  billing_reason: "subscription_cycle",
  currency: "usd",
  customer: "cus_1",
  amount_paid: 5285,
  amount_due: 5285,
  parent: { type: "subscription_details", subscription_details: { subscription: "sub_1", metadata: {} } },
  total_taxes: [{ amount: 261, tax_behavior: "exclusive" }],
  lines: {
    data: [
      { amount: 4249, quantity: 1, pricing: { type: "price_details", unit_amount_decimal: "4249", price_details: { price: "price_sup", product: "ip6_SUP-IP6-CAP240" } } },
      { amount: 775, quantity: 1, pricing: { type: "price_details", unit_amount_decimal: "775", price_details: { price: "price_ship", product: "ip6_shipping" } } },
    ],
  },
} as unknown as Stripe.Invoice;

const subscription = { id: "sub_1", status: "active", metadata: {}, pause_collection: null, trial_end: null, customer: "cus_1", items: { data: [{ current_period_end: 1800000000, price: { id: "price_sup" }, quantity: 1 }] } };
const stripe = {
  subscriptions: { retrieve: vi.fn(async () => subscription), update: vi.fn() },
  customers: { retrieve: vi.fn(async () => ({ id: "cus_1", shipping: null })) },
  invoicePayments: { list: vi.fn(async () => ({ data: [{ status: "paid", payment: { type: "payment_intent", payment_intent: "pi_renewal" } }] })) },
  refunds: { create: vi.fn() },
} as unknown as Stripe;

beforeEach(() => {
  ddb.reset();
  ses.reset();
  ddb.on(GetCommand, { TableName: TABLES.Subscriptions }).resolves({ Item: record });
  ddb.on(GetCommand, { TableName: TABLES.Orders }).resolves({ Item: firstOrder });
  ddb.on(PutCommand).resolves({});
  ddb.on(UpdateCommand).resolves({});
  ddb.on(ScanCommand).resolves({ Items: [] });
  // Untracked SKU: the renewal sells without touching inventory.
  ddb.on(QueryCommand).resolves({ Items: [] });
  ses.on(SendEmailCommand).resolves({ MessageId: "m1" });
});

describe("subscription renewal (invoice.payment_succeeded)", () => {
  it("creates one paid order from the invoice's subscription, lines, tax and payment", async () => {
    await handleRenewalPaid(stripe, invoice);
    const put = ddb.commandCalls(PutCommand).map((c) => c.args[0].input).find((i) => i.TableName === TABLES.Orders)!;
    const order = put.Item as OrderRecord;
    expect(put.ConditionExpression).toBe("attribute_not_exists(orderId)");
    expect(order.orderId).toMatch(/^IP6-R[0-9A-F]{10}$/);
    expect(order.status).toBe("paid");
    expect(order.items[0]).toMatchObject({ sku: "SUP-IP6-CAP240", qty: 1, unitPriceCents: 4249, lineTotalCents: 4249 });
    expect(order.shippingCents).toBe(775);
    expect(order.taxCents).toBe(261);
    expect(order.totalCents).toBe(5285);
    expect(order.stripePaymentIntentId).toBe("pi_renewal");
    expect(order.shippingAddress.city).toBe("Towson");
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
  });

  it("ignores invoices that aren't a subscription renewal", async () => {
    await handleRenewalPaid(stripe, { ...invoice, billing_reason: "subscription_create" } as Stripe.Invoice);
    await handleRenewalPaid(stripe, { ...invoice, parent: null } as Stripe.Invoice);
    expect(ddb.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("emails the subscriber when a renewal payment fails", async () => {
    await handleRenewalFailed(invoice);
    expect(ses.commandCalls(SendEmailCommand)).toHaveLength(1);
  });
});

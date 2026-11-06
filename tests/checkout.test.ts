import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@/content/products";

vi.mock("@/lib/rate-limit", () => ({ limitByIp: async () => null, hit: async () => true, tooMany: () => new Response(null, { status: 429 }) }));

const deps = vi.hoisted(() => ({ secrets: vi.fn(), tax: vi.fn(), session: vi.fn(), sessionUpdate: vi.fn(), coupon: vi.fn(), discount: vi.fn(), order: vi.fn(), getOrder: vi.fn(), retrieve: vi.fn(), hold: vi.fn(), release: vi.fn(), stripeProducts: { retrieve: async (id: string) => ({ id, name: "IP6 Original Supplement", active: true, metadata: { sku: "SUP-IP6-CAP240" } }), update: async () => ({}), create: async () => ({}) } }));
vi.mock("@/lib/aws/secrets", () => ({ getStripeSecrets: deps.secrets }));
vi.mock("stripe", () => ({
  default: class {
    tax = { calculations: { create: deps.tax } };
    checkout = { sessions: { create: deps.session, update: deps.sessionUpdate, retrieve: deps.retrieve } };
    // Quoted key: the test file also imports a binding named products.
    "products" = deps.stripeProducts;
    coupons = { create: deps.coupon };
  },
}));
vi.mock("@/lib/data/catalog", () => ({ getCatalogFresh: async () => products }));
vi.mock("@/lib/data/settings", () => ({
  getPreorderSettingsFresh: async () => ({ active: true, discountPct: 15, label: "Pre-order", shipNote: "Ships later" }),
}));
vi.mock("@/lib/data/discounts", () => ({ checkDiscount: deps.discount, holdDiscount: async () => true, releaseDiscountHold: async () => undefined }));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/inventory/orders", () => ({ holdForCheckout: deps.hold, releaseOrder: deps.release }));
vi.mock("@/lib/data/orders", () => ({ createPendingOrder: deps.order, getOrder: deps.getOrder, emailKey: (email: string) => email }));

const input = {
  email: "checkout-check@example.com",
  address: { name: "Checkout Check", line1: "1600 Pennsylvania Avenue NW", city: "Washington", region: "DC", postalCode: "20500", country: "US" },
  items: [{ variantId: "sup-capsule-240", qty: 1 }],
  currency: "USD",
};
const request = (body: unknown = input) => new Request("http://localhost/api/checkout/quote", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_TAX_ENABLED", "true");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  deps.secrets.mockResolvedValue({ secretKey: "sk_test_fixture", publishableKey: "pk_test_fixture", webhookSecret: "whsec_fixture" });
  deps.tax.mockResolvedValue({ id: "taxcalc_fixture", tax_amount_exclusive: 300 });
  deps.session.mockResolvedValue({ id: "cs_fixture" });
  deps.sessionUpdate.mockResolvedValue({ id: "cs_fixture", client_secret: "cs_fixture_secret", amount_total: 5579, total_details: { amount_tax: 300 } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

// The first test loads the whole checkout route cold (Stripe SDK, catalog), which
// can take longer than the default limit on a slow machine.
describe("checkout with tax enabled", { timeout: 30_000 }, () => {
  it("prices through the real quote handler, includes tax, and creates no order or payment", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect((await res.json()).quote).toMatchObject({ subtotalCents: 4504, taxCents: 300, totalCents: 5579 });
    expect(deps.tax).toHaveBeenCalledWith(expect.objectContaining({
      currency: "usd", line_items: [{ amount: 4504, reference: "sup-capsule-240", quantity: 1 }],
      shipping_cost: { amount: 775 },
    }));
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.order).not.toHaveBeenCalled();
  });

  it.each(["", "sk_test_REPLACE_ME"])("detects missing/placeholder Stripe configuration (%s)", async (secretKey) => {
    deps.secrets.mockResolvedValue({ secretKey });
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Checkout is temporarily unavailable. Please try again later." });
    expect(console.error).toHaveBeenCalledWith("[checkout] quote failed", "StripeConfigurationError");
    expect(deps.tax).not.toHaveBeenCalled();
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.order).not.toHaveBeenCalled();
  });

  it("does not silently omit tax when Stripe fails or expose provider error details", async () => {
    deps.tax.mockRejectedValue(new Error("private provider details"));
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "We couldn't price your order. Please try again." });
    expect(deps.order).not.toHaveBeenCalled();
  });

  it("rejects the retired product before contacting Stripe", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request({ ...input, items: [{ variantId: "sup-capsule-60", qty: 1 }] }));
    expect(res.status).toBe(422);
    expect(deps.tax).not.toHaveBeenCalled();
  });

  it("refuses a non-US shipping address on quote and payment, before contacting Stripe", async () => {
    const abroad = { ...input, address: { ...input.address, city: "London", region: "", postalCode: "SW1A 1AA", country: "GB" } };
    const quote = await (await import("@/app/api/checkout/quote/route")).POST(request(abroad));
    expect(quote.status).toBe(422);
    expect(await quote.json()).toMatchObject({ blocked: "country", error: "We currently ship to US addresses only." });
    const pay = await (await import("@/app/api/checkout/session/route")).POST(request(abroad));
    expect(pay.status).toBe(422);
    expect(deps.tax).not.toHaveBeenCalled();
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.order).not.toHaveBeenCalled();
  });

  it("refuses US territory and APO addresses at payment", async () => {
    const { POST } = await import("@/app/api/checkout/session/route");
    const pr = await POST(request({ ...input, address: { ...input.address, city: "San Juan", region: "PR", postalCode: "00901" } }));
    expect(await pr.json()).toMatchObject({ blocked: "territory" });
    const apo = await POST(request({ ...input, address: { ...input.address, city: "APO", region: "AE", postalCode: "09012" } }));
    expect(await apo.json()).toMatchObject({ blocked: "military" });
    expect(deps.session).not.toHaveBeenCalled();
  });

  it("refuses prices in another currency", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request({ ...input, currency: "EUR" }));
    expect(res.status).toBe(422);
    expect(deps.tax).not.toHaveBeenCalled();
  });

  it("rejects malformed checkout input before contacting Stripe", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    expect((await POST(request({ ...input, items: [] }))).status).toBe(400);
    expect(deps.tax).not.toHaveBeenCalled();
  });

  it("builds the Checkout Session only from the server quote, and records what Stripe will charge", async () => {
    const { POST } = await import("@/app/api/checkout/session/route");
    const res = await POST(request({ ...input, totalCents: 1 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ clientSecret: "cs_fixture_secret", quote: { taxCents: 300, totalCents: 5579 } });
    const [params] = deps.session.mock.calls[0]!;
    expect(params).toMatchObject({
      ui_mode: "elements",
      mode: "payment",
      customer_email: input.email,
      line_items: [{ quantity: 1, price_data: { currency: "usd", product: "ip6_sup_ip6_cap240", unit_amount: 4504 } }],
      automatic_tax: { enabled: true },
      permissions: { update_shipping_details: "server_only" },
      payment_intent_data: { metadata: { orderId: body.orderId } },
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: { orderId: body.orderId },
    });
    expect(params.return_url).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(params).not.toHaveProperty("customer_creation");
    expect(deps.sessionUpdate).toHaveBeenCalledWith("cs_fixture", expect.objectContaining({
      collected_information: { shipping_details: expect.objectContaining({ address: expect.objectContaining({ country: "US" }) }) },
      shipping_options: [expect.objectContaining({ shipping_rate_data: expect.objectContaining({ fixed_amount: { amount: 775, currency: "usd" } }) })],
    }), expect.any(Object));
    expect(deps.coupon).not.toHaveBeenCalled();
    // Stock is held for the order, for the destination, before payment can start.
    expect(deps.hold).toHaveBeenCalledWith(body.orderId, [{ sku: "SUP-IP6-CAP240", qty: 1 }], "US", expect.any(Date));
    expect(deps.order).toHaveBeenCalledWith(expect.objectContaining({ taxCents: 300, totalCents: 5579, stripeCheckoutSessionId: "cs_fixture", stripePaymentIntentId: "" }));
  });

  it("refuses checkout and releases nothing it didn't take when stock just sold out", async () => {
    const { InventoryError } = await import("@/lib/inventory/store");
    deps.hold.mockRejectedValue(new InventoryError("not_enough_stock"));
    const { POST } = await import("@/app/api/checkout/session/route");
    const res = await POST(request());
    expect(res.status).toBe(422);
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.release).not.toHaveBeenCalled();
  });

  it("releases the stock hold if Stripe fails after it was taken", async () => {
    deps.session.mockRejectedValue(new Error("stripe down"));
    deps.release.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/checkout/session/route");
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(deps.release).toHaveBeenCalledTimes(1);
  });

  it("applies a discount code as a single-use Stripe coupon for exactly the quoted amount", async () => {
    deps.discount.mockResolvedValue({ ok: true, code: "WELCOME10", amountCents: 425, description: "10% off" });
    deps.coupon.mockResolvedValue({ id: "coupon_fixture" });
    const { POST } = await import("@/app/api/checkout/session/route");
    const res = await POST(request({ ...input, discountCode: "WELCOME10" }));
    expect(res.status).toBe(200);
    expect(deps.coupon).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 425, currency: "usd", duration: "once", max_redemptions: 1 }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^checkout-IP6-[A-Z0-9]+-coupon$/) }),
    );
    expect(deps.session.mock.calls[0]![0]).toMatchObject({ discounts: [{ coupon: "coupon_fixture" }] });
    expect(deps.order).toHaveBeenCalledWith(expect.objectContaining({ discountCode: "WELCOME10", discountCents: 425 }));
  });

  it("saves the card and creates a customer when the order starts a subscription", async () => {
    const { POST } = await import("@/app/api/checkout/session/route");
    const res = await POST(request({ ...input, items: [{ variantId: "sup-capsule-240", qty: 2, subscriptionCycleDays: 30 }] }));
    expect(res.status).toBe(200);
    const [params] = deps.session.mock.calls[0]!;
    expect(params).toMatchObject({ customer_creation: "always", payment_intent_data: { setup_future_usage: "off_session" } });
    expect(params.line_items[0]).toMatchObject({ quantity: 2, price_data: { unit_amount: 4504 } });
  });

  it("refuses payment with placeholder keys even when tax is disabled", async () => {
    vi.stubEnv("STRIPE_TAX_ENABLED", "false");
    deps.secrets.mockResolvedValue({ secretKey: "sk_test_REPLACE_ME" });
    const { POST } = await import("@/app/api/checkout/session/route");
    expect((await POST(request())).status).toBe(503);
    expect(deps.session).not.toHaveBeenCalled();
    expect(deps.order).not.toHaveBeenCalled();
  });
});

describe("payment page shipping update (runServerUpdate)", () => {
  const put = (body: unknown) => new Request("http://localhost/api/checkout/session", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const pending = { orderId: "IP6-ABCDEF2345", status: "pending", stripeCheckoutSessionId: "cs_test_abcdefghijkl", currency: "USD", shippingLabel: "Standard · USPS", shippingCents: 775, shippingAddress: input.address };

  it("re-applies the order's own address and rate, never anything from the request", async () => {
    deps.retrieve.mockResolvedValue({ id: "cs_test_abcdefghijkl", status: "open", metadata: { orderId: "IP6-ABCDEF2345" } });
    deps.getOrder.mockResolvedValue(pending);
    deps.sessionUpdate.mockResolvedValue({});
    const { PUT } = await import("@/app/api/checkout/session/route");
    const res = await PUT(put({ sessionId: "cs_test_abcdefghijkl", address: { country: "GB" } }));
    expect(res.status).toBe(200);
    expect(deps.sessionUpdate).toHaveBeenCalledWith("cs_test_abcdefghijkl", expect.objectContaining({
      collected_information: { shipping_details: { name: "Checkout Check", address: expect.objectContaining({ country: "US", postal_code: "20500" }) } },
      shipping_options: [expect.objectContaining({ shipping_rate_data: expect.objectContaining({ fixed_amount: { amount: 775, currency: "usd" } }) })],
    }), undefined);
  });

  it("refuses a session that isn't this order's, or is no longer open", async () => {
    const { PUT } = await import("@/app/api/checkout/session/route");
    deps.retrieve.mockResolvedValue({ id: "cs_test_abcdefghijkl", status: "open", metadata: { orderId: "IP6-ABCDEF2345" } });
    deps.getOrder.mockResolvedValue({ ...pending, stripeCheckoutSessionId: "cs_test_other0000000" });
    expect((await PUT(put({ sessionId: "cs_test_abcdefghijkl" }))).status).toBe(404);
    deps.getOrder.mockResolvedValue(pending);
    deps.retrieve.mockResolvedValue({ id: "cs_test_abcdefghijkl", status: "complete", metadata: { orderId: "IP6-ABCDEF2345" } });
    expect((await PUT(put({ sessionId: "cs_test_abcdefghijkl" }))).status).toBe(404);
    expect((await PUT(put({ sessionId: "not-a-session" }))).status).toBe(404);
    expect(deps.sessionUpdate).not.toHaveBeenCalled();
  });

  it("reports a returning shopper's payment only for the order named in the link", async () => {
    const { GET } = await import("@/app/api/checkout/session/route");
    deps.retrieve.mockResolvedValue({ id: "cs_test_abcdefghijkl", status: "complete", payment_status: "paid", metadata: { orderId: "IP6-ABCDEF2345" } });
    const ok = await GET(new Request("http://localhost/api/checkout/session?session_id=cs_test_abcdefghijkl&order=IP6-ABCDEF2345"));
    expect(await ok.json()).toEqual({ status: "complete", paymentStatus: "paid" });
    const other = await GET(new Request("http://localhost/api/checkout/session?session_id=cs_test_abcdefghijkl&order=IP6-ZZZZZZ2345"));
    expect(other.status).toBe(404);
  });
});

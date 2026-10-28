import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@/content/products";

const deps = vi.hoisted(() => ({ secrets: vi.fn(), tax: vi.fn(), intent: vi.fn(), order: vi.fn() }));
vi.mock("@/lib/aws/secrets", () => ({ getStripeSecrets: deps.secrets }));
vi.mock("stripe", () => ({
  default: class {
    tax = { calculations: { create: deps.tax } };
    paymentIntents = { create: deps.intent };
  },
}));
vi.mock("@/lib/data/catalog", () => ({ getCatalogFresh: async () => products }));
vi.mock("@/lib/data/settings", () => ({
  getPreorderSettingsFresh: async () => ({ active: true, discountPct: 15, label: "Pre-order", shipNote: "Ships later" }),
}));
vi.mock("@/lib/data/discounts", () => ({ checkDiscount: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/data/orders", () => ({ createPendingOrder: deps.order, emailKey: (email: string) => email }));

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
  deps.intent.mockResolvedValue({ id: "pi_fixture", client_secret: "pi_fixture_secret" });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("checkout with tax enabled", () => {
  it("prices through the real quote handler, includes tax, and creates no order or payment", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect((await res.json()).quote).toMatchObject({ subtotalCents: 4249, taxCents: 300, totalCents: 5324 });
    expect(deps.tax).toHaveBeenCalledWith(expect.objectContaining({
      currency: "usd", line_items: [{ amount: 4249, reference: "sup-capsule-240", quantity: 1 }],
      shipping_cost: { amount: 775 },
    }));
    expect(deps.intent).not.toHaveBeenCalled();
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
    expect(deps.intent).not.toHaveBeenCalled();
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

  it("rejects malformed checkout input before contacting Stripe", async () => {
    const { POST } = await import("@/app/api/checkout/quote/route");
    expect((await POST(request({ ...input, items: [] }))).status).toBe(400);
    expect(deps.tax).not.toHaveBeenCalled();
  });

  it("uses the taxed server total for payment and the pending order", async () => {
    const { POST } = await import("@/app/api/checkout/intent/route");
    const res = await POST(request({ ...input, totalCents: 1 }));
    expect(res.status).toBe(200);
    expect(deps.intent).toHaveBeenCalledWith(expect.objectContaining({
      amount: 5324, metadata: expect.objectContaining({ taxCalculationId: "taxcalc_fixture" }),
    }), expect.any(Object));
    expect(deps.order).toHaveBeenCalledWith(expect.objectContaining({ taxCents: 300, totalCents: 5324, stripePaymentIntentId: "pi_fixture" }));
  });

  it("refuses payment with placeholder keys even when tax is disabled", async () => {
    vi.stubEnv("STRIPE_TAX_ENABLED", "false");
    deps.secrets.mockResolvedValue({ secretKey: "sk_test_REPLACE_ME" });
    const { POST } = await import("@/app/api/checkout/intent/route");
    expect((await POST(request())).status).toBe(503);
    expect(deps.intent).not.toHaveBeenCalled();
    expect(deps.order).not.toHaveBeenCalled();
  });
});

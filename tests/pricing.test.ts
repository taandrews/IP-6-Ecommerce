import { describe, expect, it } from "vitest";
import { priceLines, finishQuote, shippingOptions } from "@/lib/pricing/quote";
import { evaluateDiscount, normalizeCode } from "@/lib/pricing/discount";
import { products } from "@/content/products";
import { mergeCatalog } from "@/lib/data/catalog";
import type { DiscountRecord, PreorderSettings } from "@/types/records";

const preorder: PreorderSettings = { active: true, discountPct: 15, label: "Pre-order", shipNote: "Ships later" };
const off: PreorderSettings = { ...preorder, active: false };
const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
const big = supplement.variants[0]!;

describe("priceLines (server-side pricing)", () => {
  it("prices from the catalog, not from anything the browser sends", () => {
    const r = priceLines(products, [{ variantId: big.id, qty: 2 }], "USD", off);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.lines[0]!.unitPriceCents).toBe(big.priceCents.USD);
    expect(r.value.subtotalCents).toBe(big.priceCents.USD * 2);
  });

  it("applies the pre-order discount to one-time lines only", () => {
    const r = priceLines(products, [{ variantId: big.id, qty: 1 }, { variantId: big.id, qty: 1, subscriptionCycleDays: 30 }], "USD", preorder);
    if (!r.ok) throw new Error("expected ok");
    const [oneTime, sub] = r.value.lines;
    expect(oneTime!.discountPct).toBe(15);
    expect(oneTime!.preorder).toBe(true);
    expect(sub!.discountPct).toBe(supplement.subscriptionCycles.find((c) => c.days === 30)!.discountPct);
    expect(sub!.preorder).toBe(false);
  });

  it("rejects unknown variants, bad quantities and made-up subscription cycles", () => {
    expect(priceLines(products, [{ variantId: "nope", qty: 1 }], "USD", off)).toMatchObject({ ok: false, error: { code: "unknown_item" } });
    expect(priceLines(products, [{ variantId: big.id, qty: 0 }], "USD", off)).toMatchObject({ ok: false, error: { code: "bad_quantity" } });
    expect(priceLines(products, [{ variantId: big.id, qty: 21 }], "USD", off)).toMatchObject({ ok: false, error: { code: "bad_quantity" } });
    expect(priceLines(products, [{ variantId: big.id, qty: 1, subscriptionCycleDays: 7 }], "USD", off)).toMatchObject({
      ok: false,
      error: { code: "bad_subscription" },
    });
    expect(priceLines(products, [], "USD", off)).toMatchObject({ ok: false, error: { code: "empty_cart" } });
  });

  it("refuses an item made unavailable in the admin portal", () => {
    const merged = mergeCatalog(products, [{ sku: supplement.sku, available: { [big.id]: false }, updatedAt: "", updatedBy: "" }], []);
    expect(priceLines(merged, [{ variantId: big.id, qty: 1 }], "USD", off)).toMatchObject({ ok: false, error: { code: "out_of_stock" } });
  });

  it("uses admin price overrides and stock", () => {
    const merged = mergeCatalog(
      products,
      [{ sku: supplement.sku, prices: { [big.id]: { USD: 4500 } }, updatedAt: "", updatedBy: "" }],
      [{ sku: big.sku, stock: 0, lowStockThreshold: 5, allowBackorder: false, updatedAt: "" }],
    );
    const v = merged.find((p) => p.sku === supplement.sku)!.variants.find((x) => x.id === big.id)!;
    expect(v.priceCents.USD).toBe(4500);
    expect(v.priceCents.CAD).toBe(big.priceCents.CAD);
    expect(v.inStock).toBe(false);
    const backorder = mergeCatalog(products, [], [{ sku: big.sku, stock: 0, lowStockThreshold: 5, allowBackorder: true, updatedAt: "" }]);
    expect(backorder.find((p) => p.sku === supplement.sku)!.variants.find((x) => x.id === big.id)!.inStock).toBe(true);
  });
});

describe("finishQuote", () => {
  it("totals subtotal minus discount plus shipping plus tax, and needs a valid rate", () => {
    const priced = priceLines(products, [{ variantId: big.id, qty: 1 }], "USD", off);
    if (!priced.ok) throw new Error("expected ok");
    const rates = shippingOptions(priced.value, 0, "USD", "US", "21093");
    expect(rates.length).toBeGreaterThan(0);
    const q = finishQuote(priced.value, "USD", { code: "TEN", amountCents: 1000 }, rates, "standard", 250);
    if (!q.ok) throw new Error("expected ok");
    expect(q.value.totalCents).toBe(priced.value.subtotalCents - 1000 + q.value.shipping.amountCents + 250);
    expect(finishQuote(priced.value, "USD", null, rates, "teleport")).toMatchObject({ ok: false, error: { code: "unknown_rate" } });
    expect(finishQuote(priced.value, "USD", null, [], "standard")).toMatchObject({ ok: false, error: { code: "no_shipping" } });
  });

  it("gives free US standard shipping at $75 after discounts", () => {
    const priced = priceLines(products, [{ variantId: big.id, qty: 2 }], "USD", off);
    if (!priced.ok) throw new Error("expected ok");
    const free = shippingOptions(priced.value, 0, "USD", "US", "21093").find((r) => r.id === "standard")!;
    expect(free.amountCents).toBe(0);
    const notFree = shippingOptions(priced.value, priced.value.subtotalCents - 7000, "USD", "US", "21093").find((r) => r.id === "standard")!;
    expect(notFree.amountCents).toBeGreaterThan(0);
  });

  it("never lets a discount exceed the subtotal", () => {
    const priced = priceLines(products, [{ variantId: big.id, qty: 1 }], "USD", off);
    if (!priced.ok) throw new Error("expected ok");
    const rates = shippingOptions(priced.value, 0, "USD", "US", "21093");
    const q = finishQuote(priced.value, "USD", { code: "HUGE", amountCents: 999999 }, rates, "standard");
    if (!q.ok) throw new Error("expected ok");
    expect(q.value.discountCents).toBe(priced.value.subtotalCents);
    expect(q.value.totalCents).toBe(q.value.shipping.amountCents);
  });
});

describe("evaluateDiscount", () => {
  const base: DiscountRecord = { code: "SAVE10", type: "percentage", value: 10, usesCount: 0, active: "1", createdAt: "", createdBy: "" };
  const ctx = { subtotalCents: 10000, currency: "USD" as const, customerRedemptions: 0, now: new Date("2026-10-20T12:00:00Z") };

  it("calculates percent and fixed amounts", () => {
    expect(evaluateDiscount(base, ctx)).toMatchObject({ ok: true, amountCents: 1000 });
    expect(evaluateDiscount({ ...base, type: "fixed", value: 500, currency: "USD" }, ctx)).toMatchObject({ ok: true, amountCents: 500 });
  });

  it("enforces every rule", () => {
    expect(evaluateDiscount(null, ctx)).toMatchObject({ ok: false, reason: "invalid" });
    expect(evaluateDiscount({ ...base, active: "0" }, ctx)).toMatchObject({ reason: "inactive" });
    expect(evaluateDiscount({ ...base, expiresAt: "2026-10-01T00:00:00Z" }, ctx)).toMatchObject({ reason: "expired" });
    expect(evaluateDiscount({ ...base, startsAt: "2026-11-01T00:00:00Z" }, ctx)).toMatchObject({ reason: "not_started" });
    expect(evaluateDiscount({ ...base, maxUses: 3, usesCount: 3 }, ctx)).toMatchObject({ reason: "used_up" });
    expect(evaluateDiscount({ ...base, perCustomerLimit: 1 }, { ...ctx, customerRedemptions: 1 })).toMatchObject({ reason: "customer_limit" });
    expect(evaluateDiscount({ ...base, minSubtotalCents: 20000 }, ctx)).toMatchObject({ reason: "minimum" });
    expect(evaluateDiscount({ ...base, type: "fixed", value: 500, currency: "GBP" }, ctx)).toMatchObject({ reason: "currency" });
  });

  it("normalizes codes", () => {
    expect(normalizeCode("  save-10 ")).toBe("SAVE-10");
    expect(normalizeCode("a'; DROP")).toBe("ADROP");
  });
});

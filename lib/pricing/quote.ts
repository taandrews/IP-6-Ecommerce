/**
 * Server-side order pricing. The browser sends only what it wants to buy
 * (variant, quantity, optional subscription cycle); every price, discount and
 * shipping amount is recomputed here from the catalog and the live settings,
 * so a tampered request cannot change what Stripe charges.
 */
import type { Currency, Product } from "@/types";
import type { OrderLine, PreorderSettings } from "@/types/records";
import { calculateRates, type ShippingRate } from "@/lib/shipping";

export const MAX_QTY_PER_LINE = 20;
export const MAX_LINES = 20;

export interface RequestedLine {
  variantId: string;
  qty: number;
  subscriptionCycleDays?: number;
}

export type QuoteError =
  | { code: "unknown_item"; variantId: string }
  | { code: "out_of_stock"; variantId: string }
  | { code: "not_enough_stock"; variantId: string; available: number }
  | { code: "bad_quantity"; variantId: string }
  | { code: "bad_subscription"; variantId: string }
  | { code: "too_many_lines" }
  | { code: "empty_cart" }
  | { code: "no_shipping" }
  | { code: "unknown_rate" };

export interface PricedLines {
  lines: OrderLine[];
  subtotalCents: number;
  hasSubscription: boolean;
  hasPreorder: boolean;
}

export function priceLines(
  catalog: Product[],
  requested: RequestedLine[],
  currency: Currency,
  preorder: PreorderSettings,
): { ok: true; value: PricedLines } | { ok: false; error: QuoteError } {
  if (requested.length === 0) return { ok: false, error: { code: "empty_cart" } };
  if (requested.length > MAX_LINES) return { ok: false, error: { code: "too_many_lines" } };
  // The cap and the stock check apply to each variant in total, so repeating
  // a variant across several lines can't get past them.
  const totals = new Map<string, number>();
  for (const r of requested) totals.set(r.variantId, (totals.get(r.variantId) ?? 0) + (Number.isInteger(r.qty) ? r.qty : NaN));
  const lines: OrderLine[] = [];
  for (const r of requested) {
    const product = catalog.find((p) => p.variants.some((v) => v.id === r.variantId));
    const variant = product?.variants.find((v) => v.id === r.variantId);
    if (!product || !variant || product.comingSoon) return { ok: false, error: { code: "unknown_item", variantId: r.variantId } };
    if (!variant.inStock) return { ok: false, error: { code: "out_of_stock", variantId: r.variantId } };
    const total = totals.get(r.variantId)!;
    if (!Number.isInteger(r.qty) || r.qty < 1 || !(total <= MAX_QTY_PER_LINE)) {
      return { ok: false, error: { code: "bad_quantity", variantId: r.variantId } };
    }
    if (variant.available !== undefined && total > variant.available) {
      return { ok: false, error: { code: "not_enough_stock", variantId: r.variantId, available: variant.available } };
    }
    let discountPct = 0;
    let preorderLine = false;
    if (r.subscriptionCycleDays !== undefined) {
      const cycle = product.subscriptionCycles.find((c) => c.days === r.subscriptionCycleDays);
      if (!cycle) return { ok: false, error: { code: "bad_subscription", variantId: r.variantId } };
      discountPct = cycle.discountPct;
    } else if (preorder.active) {
      discountPct = preorder.discountPct;
      preorderLine = true;
    }
    const unit = variant.priceCents[currency];
    if (!Number.isInteger(unit) || unit <= 0) return { ok: false, error: { code: "unknown_item", variantId: r.variantId } };
    lines.push({
      sku: variant.sku,
      variantId: variant.id,
      name: product.name,
      variantLabel: [variant.name, variant.size].filter(Boolean).join(" · "),
      qty: r.qty,
      unitPriceCents: unit,
      discountPct,
      lineTotalCents: Math.round(unit * r.qty * (1 - discountPct / 100)),
      preorder: preorderLine,
      ...(r.subscriptionCycleDays !== undefined ? { subscriptionCycleDays: r.subscriptionCycleDays } : {}),
    });
  }
  return {
    ok: true,
    value: {
      lines,
      subtotalCents: lines.reduce((s, l) => s + l.lineTotalCents, 0),
      hasSubscription: lines.some((l) => l.subscriptionCycleDays !== undefined),
      hasPreorder: lines.some((l) => l.preorder),
    },
  };
}

export function shippingOptions(
  priced: PricedLines,
  discountCents: number,
  currency: Currency,
  country: string,
  postal: string,
): ShippingRate[] {
  return calculateRates({
    items: priced.lines.map((l) => ({ sku: l.sku, qty: l.qty, unitPriceCents: l.unitPriceCents })),
    destinationCountry: country,
    destinationPostal: postal,
    currency,
    merchandiseCents: Math.max(0, priced.subtotalCents - discountCents),
  });
}

export interface Quote extends PricedLines {
  currency: Currency;
  discountCode?: string;
  discountCents: number;
  shipping: ShippingRate;
  taxCents: number;
  totalCents: number;
}

export function finishQuote(
  priced: PricedLines,
  currency: Currency,
  discount: { code: string; amountCents: number } | null,
  rates: ShippingRate[],
  rateId: string,
  taxCents = 0,
): { ok: true; value: Quote } | { ok: false; error: QuoteError } {
  if (rates.length === 0) return { ok: false, error: { code: "no_shipping" } };
  const shipping = rates.find((r) => r.id === rateId);
  if (!shipping) return { ok: false, error: { code: "unknown_rate" } };
  const discountCents = Math.min(discount?.amountCents ?? 0, priced.subtotalCents);
  const totalCents = priced.subtotalCents - discountCents + shipping.amountCents + taxCents;
  return {
    ok: true,
    value: {
      ...priced,
      currency,
      ...(discount && discountCents > 0 ? { discountCode: discount.code } : {}),
      discountCents,
      shipping,
      taxCents,
      totalCents,
    },
  };
}

export const QUOTE_MESSAGES: Record<QuoteError["code"], string> = {
  unknown_item: "An item in your cart is no longer available. Please remove it and try again.",
  out_of_stock: "An item in your cart is out of stock.",
  not_enough_stock: "We don't have that many of an item in your cart left. Please lower the quantity.",
  bad_quantity: `Each item is limited to ${MAX_QTY_PER_LINE} per order.`,
  bad_subscription: "That subscription option is not available.",
  too_many_lines: "Your cart has too many items.",
  empty_cart: "Your cart is empty.",
  no_shipping: "We can't ship one or more items in your cart to this destination.",
  unknown_rate: "Please choose a shipping method.",
};

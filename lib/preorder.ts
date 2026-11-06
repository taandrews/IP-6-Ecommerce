/**
 * Pre-order pricing. One-time purchases get the pre-order discount while the
 * window is open; subscription lines keep their own cycle discount and the
 * two never stack. The live values come from the admin portal (Settings
 * table); DEFAULT_PREORDER is the fallback when the table is unreachable.
 * Shared by the storefront, the cart, checkout and the Checkout Session route
 * so every price the customer sees matches what Stripe charges.
 */
import type { PreorderSettings } from "@/types/records";

export const DEFAULT_PREORDER: PreorderSettings = {
  active: true,
  discountPct: 15,
  label: "Pre-order",
  shipNote: "Starts shipping November 2026",
};

/** Kept for code that only needs the defaults (emails, metadata labels). */
export const PREORDER = DEFAULT_PREORDER;

type Discountable = { unitPriceCents: number; qty: number; subscription?: { discountPct: number } };

export function lineDiscountPct(line: Pick<Discountable, "subscription">, p: PreorderSettings = DEFAULT_PREORDER) {
  if (line.subscription) return line.subscription.discountPct;
  return p.active ? p.discountPct : 0;
}

export function isPreorderLine(line: Pick<Discountable, "subscription">, p: PreorderSettings = DEFAULT_PREORDER) {
  return p.active && !line.subscription;
}

export function lineTotalCents(line: Discountable, p: PreorderSettings = DEFAULT_PREORDER) {
  // Same rounding as the server quote: per item, then times the quantity.
  return Math.round(line.unitPriceCents * (1 - lineDiscountPct(line, p) / 100)) * line.qty;
}

export function preorderUnitCents(unitPriceCents: number, p: PreorderSettings = DEFAULT_PREORDER) {
  return p.active ? Math.round(unitPriceCents * (1 - p.discountPct / 100)) : unitPriceCents;
}

/**
 * The pre-order offer as a visitor sees it: switched off where we don't sell
 * yet, so nobody is shown a discount they can't use.
 */
export function offerFor(p: PreorderSettings, sellable: boolean): PreorderSettings {
  return sellable ? p : { ...p, active: false };
}

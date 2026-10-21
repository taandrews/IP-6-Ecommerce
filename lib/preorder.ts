/**
 * Pre-order pricing. One-time purchases get the pre-order discount while the
 * window is open; subscription lines keep their own cycle discount and the
 * two never stack. The live values come from the admin portal (Settings
 * table); DEFAULT_PREORDER is the fallback when the table is unreachable.
 * Shared by the storefront, the cart, checkout and the PaymentIntent route
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
  return Math.round(line.unitPriceCents * line.qty * (1 - lineDiscountPct(line, p) / 100));
}

export function preorderUnitCents(unitPriceCents: number, p: PreorderSettings = DEFAULT_PREORDER) {
  return p.active ? Math.round(unitPriceCents * (1 - p.discountPct / 100)) : unitPriceCents;
}

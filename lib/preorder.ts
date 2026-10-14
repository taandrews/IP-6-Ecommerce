/**
 * Pre-order window. One-time purchases get the pre-order discount; subscription
 * lines keep their own cycle discount and do not stack. Shared by the cart
 * store, cart drawer, checkout summary and the PaymentIntent route so every
 * price the customer sees matches what Stripe charges.
 */
export const PREORDER = {
  active: true,
  discountPct: 15,
  label: "Pre-order",
  shipNote: "Starts shipping November 2026",
} as const;

type Discountable = { unitPriceCents: number; qty: number; subscription?: { discountPct: number } };

export function lineDiscountPct(line: Pick<Discountable, "subscription">) {
  if (line.subscription) return line.subscription.discountPct;
  return PREORDER.active ? PREORDER.discountPct : 0;
}

export function isPreorderLine(line: Pick<Discountable, "subscription">) {
  return PREORDER.active && !line.subscription;
}

export function lineTotalCents(line: Discountable) {
  return Math.round(line.unitPriceCents * line.qty * (1 - lineDiscountPct(line) / 100));
}

export function preorderUnitCents(unitPriceCents: number) {
  return PREORDER.active ? Math.round(unitPriceCents * (1 - PREORDER.discountPct / 100)) : unitPriceCents;
}

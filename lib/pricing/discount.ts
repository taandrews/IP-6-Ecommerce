/**
 * Discount rules as pure functions so checkout and the tests share them.
 */
import type { Currency } from "@/types";
import type { DiscountRecord } from "@/types/records";

export type DiscountCheck =
  | { ok: true; code: string; amountCents: number; description: string }
  | { ok: false; reason: "invalid" | "inactive" | "not_started" | "expired" | "used_up" | "minimum" | "currency" | "customer_limit" };

export const DISCOUNT_MESSAGES: Record<Exclude<DiscountCheck, { ok: true }>["reason"], string> = {
  invalid: "That code isn't valid.",
  inactive: "That code is no longer active.",
  not_started: "That code isn't active yet.",
  expired: "That code has expired.",
  used_up: "That code has reached its limit.",
  minimum: "Your order doesn't meet this code's minimum.",
  currency: "That code doesn't apply to this currency.",
  customer_limit: "You've already used this code.",
};

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

export function evaluateDiscount(
  d: DiscountRecord | null,
  ctx: { subtotalCents: number; currency: Currency; customerRedemptions: number; now: Date },
): DiscountCheck {
  if (!d) return { ok: false, reason: "invalid" };
  if (d.active !== "1") return { ok: false, reason: "inactive" };
  if (d.startsAt && new Date(d.startsAt) > ctx.now) return { ok: false, reason: "not_started" };
  if (d.expiresAt && new Date(d.expiresAt) <= ctx.now) return { ok: false, reason: "expired" };
  if (typeof d.maxUses === "number" && d.usesCount >= d.maxUses) return { ok: false, reason: "used_up" };
  if (typeof d.perCustomerLimit === "number" && ctx.customerRedemptions >= d.perCustomerLimit) {
    return { ok: false, reason: "customer_limit" };
  }
  if (d.type === "fixed" && d.currency && d.currency !== ctx.currency) return { ok: false, reason: "currency" };
  if (typeof d.minSubtotalCents === "number" && ctx.subtotalCents < d.minSubtotalCents) {
    return { ok: false, reason: "minimum" };
  }
  const raw = d.type === "percentage" ? Math.round((ctx.subtotalCents * Math.min(Math.max(d.value, 0), 100)) / 100) : d.value;
  const amountCents = Math.max(0, Math.min(raw, ctx.subtotalCents));
  const description = d.type === "percentage" ? `${d.value}% off` : "Discount";
  return { ok: true, code: d.code, amountCents, description };
}

import "server-only";
import type Stripe from "stripe";
import { ensureProduct, productId } from "./sync";

/** Stripe product used to price recurring subscription items, one per SKU. */
export function ensureStripeProduct(stripe: Stripe, sku: string, name: string) {
  return ensureProduct(stripe, productId(sku), { name, metadata: { sku } });
}

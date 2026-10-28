import "server-only";
import type Stripe from "stripe";
import { productId } from "./sync";

/** Stripe product used to price recurring subscription items, one per SKU. */
export async function ensureStripeProduct(stripe: Stripe, sku: string, name: string) {
  const id = productId(sku);
  try {
    return await stripe.products.retrieve(id);
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    return stripe.products.create({ id, name, metadata: { sku } }, { idempotencyKey: `product-${id}` });
  }
}

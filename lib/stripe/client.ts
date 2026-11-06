"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let cached: { key: string; stripe: Promise<Stripe | null> } | null = null;

/**
 * Stripe.js for the payment form. The publishable key comes from the server
 * (Secrets Manager ip6/<env>/stripe, read by the checkout page), so the build
 * needs no Stripe setting and the key always matches the secret key.
 */
export function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (!cached || cached.key !== publishableKey) cached = { key: publishableKey, stripe: loadStripe(publishableKey) };
  return cached.stripe;
}

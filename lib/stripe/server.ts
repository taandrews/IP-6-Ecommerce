import "server-only";
import Stripe from "stripe";
import { getStripeSecrets } from "@/lib/aws/secrets";

// Keys come from AWS Secrets Manager (ip6/{env}/stripe), or from the
// STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET environment variables when both
// are set (local development). At launch, put the live keys (sk_live_...) in
// the prod secret and use the live-mode webhook endpoint's signing secret.

let cached: { stripe: Stripe; webhookSecret: string } | null = null;

export class StripeConfigurationError extends Error {
  constructor() {
    super("Stripe secret key is not configured");
    this.name = "StripeConfigurationError";
  }
}

async function init() {
  if (cached) return cached;
  const s = await getStripeSecrets();
  if (!s.secretKey || s.secretKey.includes("REPLACE_ME")) throw new StripeConfigurationError();
  // STRIPE_API_BASE points at a local Stripe test double; it is ignored in production.
  const base = process.env.NODE_ENV !== "production" && process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
  cached = {
    stripe: new Stripe(s.secretKey, {
      apiVersion: "2024-06-20",
      typescript: true,
      ...(base ? { host: base.hostname, port: Number(base.port), protocol: base.protocol.replace(":", "") as "http" | "https" } : {}),
    }),
    webhookSecret: s.webhookSecret,
  };
  return cached;
}

export async function getStripe() {
  return (await init()).stripe;
}

export async function getStripeWebhookSecret() {
  return (await init()).webhookSecret;
}

/** When true, checkout calculates sales tax with Stripe Tax (requires Stripe Tax to be set up). */
export const STRIPE_TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

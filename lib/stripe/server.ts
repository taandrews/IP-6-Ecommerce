import Stripe from "stripe";
import { getStripeSecrets } from "@/lib/aws/secrets";

// TODO: Switch to live keys at launch.
// At launch, update the StripeSecret in AWS Secrets Manager (ip6/prod/stripe)
// so secretKey starts with sk_live_... and publishableKey with pk_live_....
// Rotate the webhookSecret after creating the live-mode webhook endpoint.
// Local dev still reads from STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET env
// vars as a fallback (see lib/aws/secrets.ts).

let _stripe: Stripe | null = null;
let _webhookSecret: string | null = null;

async function init() {
  if (_stripe && _webhookSecret !== null) return { stripe: _stripe, webhookSecret: _webhookSecret };
  const s = await getStripeSecrets();
  _stripe = new Stripe(s.secretKey, { apiVersion: "2024-06-20", typescript: true });
  _webhookSecret = s.webhookSecret;
  return { stripe: _stripe, webhookSecret: _webhookSecret };
}

// Legacy synchronous export — uses env var only, falls back to a failing stub.
// Prefer `getStripe()` in new code.
const syncKey = process.env.STRIPE_SECRET_KEY;
if (!syncKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[stripe] STRIPE_SECRET_KEY not set — synchronous `stripe` export will fail. Use getStripe() instead.",
  );
}
export const stripe = new Stripe(syncKey ?? "sk_test_missing", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export async function getStripe() {
  return (await init()).stripe;
}

export async function getStripeWebhookSecret() {
  return (await init()).webhookSecret;
}

// Legacy export — prefer getStripeWebhookSecret() in new code.
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

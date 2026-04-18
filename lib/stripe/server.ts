import Stripe from "stripe";

// TODO: Switch to live keys at launch.
// Replace STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in prod env
// with sk_live_... and pk_live_... values from the Stripe dashboard, then
// rotate the STRIPE_WEBHOOK_SECRET after creating the live-mode webhook
// endpoint. This file is the single source of truth for the server Stripe
// client — there is no environment-branching logic to remove.

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  // eslint-disable-next-line no-console
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — Stripe calls will fail until configured.");
}

export const stripe = new Stripe(key ?? "sk_test_missing", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

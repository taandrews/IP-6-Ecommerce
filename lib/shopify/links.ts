/**
 * Shopify customer accounts: sign-in, order history, subscriptions,
 * addresses and saved payment methods. Safe for client components.
 * Set by NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL, which next.config.mjs requires at build time.
 */
export const SHOPIFY_ACCOUNT_URL = process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL as string;

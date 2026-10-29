/**
 * The Shopify storefront's addresses. Its launch-waitlist form posts to this
 * site's /api/waitlist so every signup lands in one list, kept apart from
 * Shopify's customer records. Only that endpoint accepts these origins.
 */
export const SHOPIFY_ORIGINS: readonly string[] = [
  "https://ip6original.com",
  "https://www.ip6original.com",
  "https://ip6-original.myshopify.com",
];

export function isShopifyOrigin(origin: string | null | undefined) {
  return !!origin && SHOPIFY_ORIGINS.includes(origin);
}

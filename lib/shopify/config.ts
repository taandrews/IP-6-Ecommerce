import "server-only";

/** A required setting: a missing value is a deployment error, never silently replaced by a built-in default. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/** e.g. ip6-original.myshopify.com (Amplify env SHOPIFY_STORE_DOMAIN). */
export const shopifyStoreDomain = () => required("SHOPIFY_STORE_DOMAIN");

/** Shopify admin for this store, for links from the staff portal. */
export const shopifyAdminUrl = () => `https://admin.shopify.com/store/${shopifyStoreDomain().replace(/\.myshopify\.com$/, "")}`;

/** The Shopify automatic discount the pre-order switch controls (Amplify env SHOPIFY_PREORDER_DISCOUNT_ID). */
export const preorderDiscountId = () => required("SHOPIFY_PREORDER_DISCOUNT_ID");

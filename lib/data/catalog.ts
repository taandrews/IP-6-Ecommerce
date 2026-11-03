import "server-only";
import { unstable_cache } from "next/cache";
import { products as baseProducts } from "@/content/products";
import { fetchShopifyCatalog } from "@/lib/shopify/storefront";
import { mergeCatalog } from "./merge-catalog";

export { mergeCatalog };

export const CATALOG_TAG = "catalog";

/**
 * Product copy, photos and FAQs live in content/products.ts. Prices, stock,
 * variant IDs and subscription plans come from Shopify, matched by SKU.
 */
async function load() {
  try {
    return mergeCatalog(baseProducts, await fetchShopifyCatalog());
  } catch (err) {
    // If Shopify is unreachable the pages still render; buying is switched off
    // because no variant has a Shopify ID to check out with.
    console.error("[catalog] shopify read failed", (err as Error).name);
    return mergeCatalog(baseProducts, []);
  }
}

const cachedCatalog = unstable_cache(load, ["catalog-shopify"], { tags: [CATALOG_TAG], revalidate: 60 });

export function getCatalog() {
  return cachedCatalog();
}

/** Uncached, for building a checkout: variant IDs and plans must be current. */
export function getCatalogFresh() {
  return load();
}

export async function getProduct(slug: string) {
  return (await getCatalog()).find((p) => p.slug === slug);
}

import "server-only";
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { products as baseProducts } from "@/content/products";
import type { Currency, Product } from "@/types";
import type { ProductOverride } from "@/types/records";
import { allStock, listLocations } from "@/lib/inventory/store";
import { summarize, type StockSummary } from "@/lib/inventory/availability";
import { SELLABLE_COUNTRIES } from "@/lib/countries";
import { mergeCatalog } from "./merge-catalog";
import { getStripe } from "@/lib/stripe/server";
import { syncProductToStripe, type SyncSummary } from "@/lib/stripe/sync";

export { mergeCatalog };

export const CATALOG_TAG = "catalog";
export const DEFAULT_LOW_STOCK = 25;

async function scanAll<T>(table: string): Promise<T[]> {
  const out: T[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(new ScanCommand({ TableName: table, ExclusiveStartKey: start }));
    out.push(...((res.Items ?? []) as T[]));
    start = res.LastEvaluatedKey;
  } while (start);
  return out;
}

async function loadOverrides() {
  try {
    const [overrides, { positions }, locations] = await Promise.all([scanAll<ProductOverride>(TABLES.Products), allStock(), listLocations()]);
    return { overrides, stock: summarize(positions, locations, SELLABLE_COUNTRIES) };
  } catch (err) {
    // If the tables are unreachable the static catalog still renders.
    console.error("[catalog] override read failed", (err as Error).name);
    return { overrides: [] as ProductOverride[], stock: [] as StockSummary[] };
  }
}

const cachedCatalog = unstable_cache(
  async () => {
    const { overrides, stock } = await loadOverrides();
    return mergeCatalog(baseProducts, overrides, stock);
  },
  ["catalog-merged"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

/** Storefront catalog with admin price and availability changes applied. */
export function getCatalog() {
  return cachedCatalog();
}

/** Uncached, for checkout: prices and stock must be current at payment time. */
export async function getCatalogFresh() {
  const { overrides, stock } = await loadOverrides();
  return mergeCatalog(baseProducts, overrides, stock);
}

export async function getProduct(slug: string) {
  return (await getCatalog()).find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// Admin writes
// ---------------------------------------------------------------------------

export async function getOverride(sku: string) {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.Products, Key: { sku } }));
  return (res.Item as ProductOverride | undefined) ?? null;
}

export async function saveVariantPricing(
  productSku: string,
  variantId: string,
  prices: Partial<Record<Currency, number>>,
  available: boolean,
  actor: string,
) {
  const current = (await getOverride(productSku)) ?? { sku: productSku, updatedAt: "", updatedBy: "" };
  const next: ProductOverride = {
    sku: productSku,
    prices: { ...(current.prices ?? {}), [variantId]: prices },
    available: { ...(current.available ?? {}), [variantId]: available },
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  await docClient.send(new PutCommand({ TableName: TABLES.Products, Item: next }));
  revalidateTag(CATALOG_TAG);
  await mirrorToStripe(productSku);
}

/** Keeps Stripe's copy of the product and prices in step with the database. A Stripe outage never blocks a price change. */
async function mirrorToStripe(productSku: string) {
  try {
    const product = (await getCatalogFresh()).find((p) => p.sku === productSku);
    if (!product) return;
    const summary: SyncSummary = { products: 0, pricesCreated: 0, pricesKept: 0, pricesArchived: 0, productsArchived: 0 };
    await syncProductToStripe(await getStripe(), product, summary);
  } catch (err) {
    console.error("[catalog] stripe sync failed", (err as Error).name);
  }
}

export async function listOverrides(): Promise<ProductOverride[]> {
  return scanAll<ProductOverride>(TABLES.Products);
}

/** The storefront shows new stock levels at once after a sale or a stock change. */
export function refreshCatalog() {
  revalidateTag(CATALOG_TAG);
}

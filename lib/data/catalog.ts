import "server-only";
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { products as baseProducts } from "@/content/products";
import type { Currency, Product } from "@/types";
import type { InventoryItem, ProductOverride } from "@/types/records";
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
    const [overrides, stock] = await Promise.all([
      scanAll<ProductOverride>(TABLES.Products),
      scanAll<InventoryItem>(TABLES.Inventory),
    ]);
    return { overrides, stock };
  } catch (err) {
    // If the tables are unreachable the static catalog still renders.
    console.error("[catalog] override read failed", (err as Error).name);
    return { overrides: [] as ProductOverride[], stock: [] as InventoryItem[] };
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

export async function listInventory(): Promise<InventoryItem[]> {
  return scanAll<InventoryItem>(TABLES.Inventory);
}

export async function setInventory(
  sku: string,
  values: { stock: number; lowStockThreshold: number; allowBackorder: boolean },
  actor: string,
) {
  const low = values.stock <= values.lowStockThreshold;
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Inventory,
      Key: { sku },
      UpdateExpression: `SET stock = :s, lowStockThreshold = :t, allowBackorder = :b, updatedAt = :u, updatedBy = :a${
        low ? ", lowStock = :one" : ""
      }${low ? "" : " REMOVE lowStock"}`,
      ExpressionAttributeValues: {
        ":s": values.stock,
        ":t": values.lowStockThreshold,
        ":b": values.allowBackorder,
        ":u": new Date().toISOString(),
        ":a": actor,
        ...(low ? { ":one": "1" } : {}),
      },
    }),
  );
  revalidateTag(CATALOG_TAG);
}

/**
 * Takes stock for a paid order. Items that allow back-orders may go below
 * zero; others never do (the condition fails instead and the order is
 * flagged for staff). Returns the SKUs that could not be decremented.
 */
export async function decrementStock(lines: Array<{ sku: string; qty: number }>) {
  const failed: string[] = [];
  for (const { sku, qty } of lines) {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLES.Inventory,
          Key: { sku },
          UpdateExpression: "SET stock = stock - :q, updatedAt = :u",
          ConditionExpression: "attribute_exists(sku) AND (stock >= :q OR allowBackorder = :t)",
          ExpressionAttributeValues: { ":q": qty, ":u": new Date().toISOString(), ":t": true },
        }),
      );
    } catch (err) {
      if ((err as Error).name === "ConditionalCheckFailedException") {
        // Untracked SKUs (no inventory row yet) are not an error.
        const row = await docClient.send(new GetCommand({ TableName: TABLES.Inventory, Key: { sku } }));
        if (row.Item) failed.push(sku);
      } else {
        throw err;
      }
    }
  }
  if (lines.length) revalidateTag(CATALOG_TAG);
  return failed;
}

export async function restock(lines: Array<{ sku: string; qty: number }>) {
  for (const { sku, qty } of lines) {
    await docClient
      .send(
        new UpdateCommand({
          TableName: TABLES.Inventory,
          Key: { sku },
          UpdateExpression: "SET stock = stock + :q, updatedAt = :u",
          ConditionExpression: "attribute_exists(sku)",
          ExpressionAttributeValues: { ":q": qty, ":u": new Date().toISOString() },
        }),
      )
      .catch((err) => {
        if ((err as Error).name !== "ConditionalCheckFailedException") throw err;
      });
  }
  revalidateTag(CATALOG_TAG);
}

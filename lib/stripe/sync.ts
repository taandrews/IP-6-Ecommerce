import type Stripe from "stripe";
import type { Currency, Product, ProductVariant } from "@/types";

/*
  Mirrors the catalog into Stripe. The database stays the source of truth:
  every sellable variant becomes one Stripe Product (id ip6_<sku>) with one
  one-time Price per currency and one recurring Price per subscription cycle,
  each addressed by a lookup key. Running the sync again changes nothing
  unless a price moved, in which case the old Price is archived and a new one
  takes over the lookup key. Nothing in Stripe is ever edited by hand.
*/

export const SHIPPING_SKU = "SHIPPING";

export function productId(sku: string) {
  return `ip6_${sku.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

export function lookupKey(sku: string, currency: Currency, cycleDays?: number) {
  return `${productId(sku)}_${currency.toLowerCase()}${cycleDays ? `_${cycleDays}d` : ""}`;
}

export function subscriptionUnitCents(priceCents: number, discountPct: number) {
  return Math.round(priceCents * (1 - discountPct / 100));
}

export interface SyncSummary {
  products: number;
  pricesCreated: number;
  pricesKept: number;
  pricesArchived: number;
  productsArchived: number;
}

interface WantedPrice {
  key: string;
  currency: string;
  unitAmount: number;
  cycleDays?: number;
}

function wantedPrices(product: Product, v: ProductVariant): WantedPrice[] {
  const out: WantedPrice[] = [];
  for (const [cur, cents] of Object.entries(v.priceCents) as [Currency, number][]) {
    if (!Number.isFinite(cents) || cents <= 0) continue;
    out.push({ key: lookupKey(v.sku, cur), currency: cur.toLowerCase(), unitAmount: cents });
    for (const c of product.subscriptionCycles) {
      out.push({ key: lookupKey(v.sku, cur, c.days), currency: cur.toLowerCase(), unitAmount: subscriptionUnitCents(cents, c.discountPct), cycleDays: c.days });
    }
  }
  return out;
}

function variantName(product: Product, v: ProductVariant) {
  return [product.name, v.name, v.size].filter(Boolean).join(", ");
}

async function ensureProduct(stripe: Stripe, id: string, params: Stripe.ProductCreateParams) {
  try {
    const existing = await stripe.products.retrieve(id);
    const changed = existing.name !== params.name || existing.active === false || JSON.stringify(existing.metadata) !== JSON.stringify(params.metadata ?? {});
    return changed ? stripe.products.update(id, { name: params.name, active: true, metadata: params.metadata, ...(params.images ? { images: params.images } : {}) }) : existing;
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    return stripe.products.create({ id, ...params }, { idempotencyKey: `product-${id}` });
  }
}

/** Mirrors one product's variants and prices into Stripe. */
export async function syncProductToStripe(stripe: Stripe, product: Product, summary: SyncSummary) {
  for (const v of product.variants) {
    const id = productId(v.sku);
    const image = v.image?.url ?? product.images[0]?.url;
    await ensureProduct(stripe, id, {
      name: variantName(product, v),
      metadata: { sku: v.sku, productSku: product.sku, variantId: v.id },
      ...(image?.startsWith("https://") ? { images: [image] } : {}),
    });
    summary.products += 1;

    const existing = await stripe.prices.list({ product: id, active: true, limit: 100 });
    const byKey = new Map(existing.data.filter((p) => p.lookup_key).map((p) => [p.lookup_key as string, p]));
    for (const want of wantedPrices(product, v)) {
      const have = byKey.get(want.key);
      const same =
        have &&
        have.currency === want.currency &&
        have.unit_amount === want.unitAmount &&
        (want.cycleDays ? have.recurring?.interval === "day" && have.recurring.interval_count === want.cycleDays : !have.recurring);
      if (same) {
        summary.pricesKept += 1;
        continue;
      }
      await stripe.prices.create(
        {
          product: id,
          currency: want.currency,
          unit_amount: want.unitAmount,
          lookup_key: want.key,
          transfer_lookup_key: true,
          ...(want.cycleDays ? { recurring: { interval: "day", interval_count: want.cycleDays } } : {}),
          metadata: { sku: v.sku, ...(want.cycleDays ? { cycleDays: String(want.cycleDays) } : {}) },
        },
        { idempotencyKey: `price-${want.key}-${want.currency}-${want.unitAmount}` },
      );
      summary.pricesCreated += 1;
      if (have) {
        await stripe.prices.update(have.id, { active: false });
        summary.pricesArchived += 1;
      }
    }
  }
}

/**
 * Mirrors the whole catalog. With archiveOthers, every other active product
 * in the account (anything created by hand) is archived so Stripe holds one
 * set of products: the site's.
 */
export async function syncCatalogToStripe(stripe: Stripe, catalog: Product[], opts: { archiveOthers?: boolean } = {}): Promise<SyncSummary> {
  const summary: SyncSummary = { products: 0, pricesCreated: 0, pricesKept: 0, pricesArchived: 0, productsArchived: 0 };
  for (const p of catalog) {
    if (p.comingSoon) continue;
    await syncProductToStripe(stripe, p, summary);
  }
  await ensureProduct(stripe, productId(SHIPPING_SKU), { name: "Shipping", metadata: { sku: SHIPPING_SKU } });

  if (opts.archiveOthers) {
    const ours = new Set([productId(SHIPPING_SKU), ...catalog.flatMap((p) => p.variants.map((v) => productId(v.sku)))]);
    for await (const prod of stripe.products.list({ active: true, limit: 100 })) {
      if (ours.has(prod.id)) continue;
      // The product goes first: Stripe refuses to archive a price while it is still a live product's default.
      await stripe.products.update(prod.id, { active: false });
      for await (const price of stripe.prices.list({ product: prod.id, active: true, limit: 100 })) {
        if (price.id !== prod.default_price) await stripe.prices.update(price.id, { active: false });
      }
      summary.productsArchived += 1;
    }
  }
  return summary;
}

/** The synced recurring Price for a subscription line, if it exists and still matches the catalog. */
export async function findSubscriptionPrice(stripe: Stripe, sku: string, currency: Currency, cycleDays: number, unitCents: number) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey(sku, currency, cycleDays)], active: true, limit: 1 });
  const price = res.data[0];
  return price && price.unit_amount === unitCents && price.currency === currency.toLowerCase() ? price : null;
}

import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { products } from "@/content/products";
import { findSubscriptionPrice, lookupKey, productId, syncCatalogToStripe } from "@/lib/stripe/sync";

/** In-memory stand-in for the Stripe products and prices API. */
function fakeStripe(seed: { products?: Record<string, Partial<Stripe.Product>>; prices?: Partial<Stripe.Price>[] } = {}) {
  const prods = new Map<string, Stripe.Product>(Object.entries(seed.products ?? {}).map(([id, p]) => [id, { id, active: true, metadata: {}, ...p } as Stripe.Product]));
  const prices: Stripe.Price[] = (seed.prices ?? []).map((p, i) => ({ id: `price_seed${i}`, active: true, ...p } as Stripe.Price));
  let n = 0;
  const missing = () => Object.assign(new Error("No such product"), { code: "resource_missing" });
  // Stripe's list() is a promise that is also async-iterable, so both `await list()` and `for await (... of list())` work.
  const paged = <T>(items: T[]) => Object.assign(Promise.resolve({ data: items }), { [Symbol.asyncIterator]: async function* () { yield* items; } });
  const stripe = {
    products: {
      retrieve: async (id: string) => { if (!prods.has(id)) throw missing(); return prods.get(id)!; },
      create: async (p: Stripe.ProductCreateParams & { id: string }) => { const prod = { active: true, metadata: {}, ...p } as unknown as Stripe.Product; prods.set(p.id, prod); return prod; },
      update: async (id: string, p: Stripe.ProductUpdateParams) => { const prod = { ...prods.get(id)!, ...p } as Stripe.Product; prods.set(id, prod); return prod; },
      list: () => paged([...prods.values()].filter((p) => p.active)),
    },
    prices: {
      list: (q: { product?: string; lookup_keys?: string[]; active?: boolean }) =>
        paged(prices.filter((p) => (q.product ? p.product === q.product : true) && (q.lookup_keys ? q.lookup_keys.includes(p.lookup_key as string) : true) && (q.active === undefined || p.active === q.active))),
      create: async (p: Stripe.PriceCreateParams) => {
        if (p.transfer_lookup_key) prices.filter((x) => x.lookup_key === p.lookup_key).forEach((x) => { x.lookup_key = null; });
        const price = { id: `price_${++n}`, active: true, ...p } as unknown as Stripe.Price; prices.push(price); return price;
      },
      update: async (id: string, p: Stripe.PriceUpdateParams) => { const price = prices.find((x) => x.id === id)!; Object.assign(price, p); return price; },
    },
  };
  return { stripe: stripe as unknown as Stripe, prods, prices };
}

const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
const big = supplement.variants[0]!;

describe("stripe catalog sync", () => {
  it("creates one product per variant and a price per currency and cycle, then changes nothing on a second run", async () => {
    const { stripe, prods, prices } = fakeStripe();
    const first = await syncCatalogToStripe(stripe, [supplement]);
    expect(prods.has(productId(big.sku))).toBe(true);
    const currencies = Object.keys(big.priceCents).length;
    expect(prices.filter((p) => p.product === productId(big.sku))).toHaveLength(currencies * (1 + supplement.subscriptionCycles.length));
    expect(first.pricesCreated).toBeGreaterThan(0);
    const second = await syncCatalogToStripe(stripe, [supplement]);
    expect(second.pricesCreated).toBe(0);
    expect(second.pricesArchived).toBe(0);
    expect(second.pricesKept).toBe(first.pricesCreated);
  });

  it("archives the old price and moves the lookup key when a price changes", async () => {
    const { stripe, prices } = fakeStripe();
    await syncCatalogToStripe(stripe, [supplement]);
    const changed = { ...supplement, variants: [{ ...big, priceCents: { ...big.priceCents, USD: big.priceCents.USD + 500 } }, ...supplement.variants.slice(1)] };
    const s = await syncCatalogToStripe(stripe, [changed]);
    const key = lookupKey(big.sku, "USD");
    const live = prices.filter((p) => p.lookup_key === key && p.active);
    expect(live).toHaveLength(1);
    expect(live[0]!.unit_amount).toBe(big.priceCents.USD + 500);
    expect(s.pricesArchived).toBe(1 + supplement.subscriptionCycles.length);
  });

  it("archives hand-made products only when asked", async () => {
    const { stripe, prods } = fakeStripe({ products: { prod_manual: { name: "Typed in by hand" } } });
    await syncCatalogToStripe(stripe, [supplement]);
    expect(prods.get("prod_manual")!.active).toBe(true);
    const s = await syncCatalogToStripe(stripe, [supplement], { archiveOthers: true });
    expect(prods.get("prod_manual")!.active).toBe(false);
    expect(s.productsArchived).toBe(1);
    expect(prods.get(productId(big.sku))!.active).toBe(true);
  });

  it("finds the synced subscription price only when it matches what was sold", async () => {
    const { stripe } = fakeStripe();
    await syncCatalogToStripe(stripe, [supplement]);
    const cycle = supplement.subscriptionCycles[0]!;
    const unit = Math.round(big.priceCents.USD * (1 - cycle.discountPct / 100));
    expect(await findSubscriptionPrice(stripe, big.sku, "USD", cycle.days, unit)).not.toBeNull();
    expect(await findSubscriptionPrice(stripe, big.sku, "USD", cycle.days, unit + 1)).toBeNull();
  });
});

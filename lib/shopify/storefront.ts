import "server-only";
import { shopifyStoreDomain } from "./config";
import { getShopifySecrets } from "@/lib/aws/secrets";

/**
 * Shopify Storefront API (Headless channel). Shopify owns products, prices,
 * stock, subscriptions (selling plans) and checkout; this site reads the
 * catalog and hands the cart to Shopify's hosted checkout.
 *
 * Calls are made only from the server, with the Headless channel's private
 * Storefront token (Secrets Manager ip6/<env>/shopify, storefrontToken) and the
 * shopper's IP, as Shopify recommends for server-side storefronts.
 */
const API_VERSION = "2025-07";

function endpoint() {
  return `https://${shopifyStoreDomain()}/api/${API_VERSION}/graphql.json`;
}

export class ShopifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyError";
  }
}

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, opts: { buyerIp?: string } = {}): Promise<T> {
  const { storefrontToken } = await getShopifySecrets();
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": storefrontToken,
      ...(opts.buyerIp ? { "Shopify-Storefront-Buyer-IP": opts.buyerIp } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new ShopifyError(`Storefront API ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new ShopifyError(body.errors.map((e) => e.message).join("; "));
  if (!body.data) throw new ShopifyError("Storefront API returned no data");
  return body.data;
}

export interface ShopifySellingPlan {
  id: string;
  name: string;
  /** Days between deliveries, from the plan's delivery interval. */
  days: number;
  discountPct: number;
}

export interface ShopifyVariant {
  id: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  availableForSale: boolean;
}

export interface ShopifyProduct {
  handle: string;
  availableForSale: boolean;
  variants: ShopifyVariant[];
  sellingPlans: ShopifySellingPlan[];
}

const CATALOG_QUERY = /* GraphQL */ `
  query Catalog {
    products(first: 50) {
      nodes {
        handle
        availableForSale
        variants(first: 20) {
          nodes { id sku availableForSale price { amount } compareAtPrice { amount } }
        }
        sellingPlanGroups(first: 5) {
          nodes {
            sellingPlans(first: 10) {
              nodes {
                id
                name
                options { name value }
                priceAdjustments { adjustmentValue { ... on SellingPlanPercentagePriceAdjustment { adjustmentPercentage } } }
              }
            }
          }
        }
      }
    }
  }
`;

type CatalogData = {
  products: {
    nodes: Array<{
      handle: string;
      availableForSale: boolean;
      variants: { nodes: Array<{ id: string; sku: string | null; availableForSale: boolean; price: { amount: string }; compareAtPrice: { amount: string } | null }> };
      sellingPlanGroups: {
        nodes: Array<{
          sellingPlans: {
            nodes: Array<{
              id: string;
              name: string;
              options: { name: string; value: string }[];
              priceAdjustments: { adjustmentValue: { adjustmentPercentage?: number } }[];
            }>;
          };
        }>;
      };
    }>;
  };
};

const cents = (amount: string) => Math.round(Number(amount) * 100);

/** "Deliver every 3 months, 20% off" or an option value like "3 months" -> 90 days. */
export function planDays(name: string, options: { value: string }[] = []): number {
  const text = [name, ...options.map((o) => o.value)].join(" ").toLowerCase();
  const m = text.match(/every\s+(\d+)?\s*(day|week|month|year)s?/) ?? text.match(/(\d+)\s*(day|week|month|year)s?/);
  if (!m) return 30;
  const n = Number(m[1] ?? 1);
  const unit = m[2];
  return unit === "day" ? n : unit === "week" ? n * 7 : unit === "year" ? n * 365 : n * 30;
}

export async function fetchShopifyCatalog(): Promise<ShopifyProduct[]> {
  const data = await storefront<CatalogData>(CATALOG_QUERY);
  return data.products.nodes.map((p) => ({
    handle: p.handle,
    availableForSale: p.availableForSale,
    variants: p.variants.nodes.map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      priceCents: cents(v.price.amount),
      compareAtCents: v.compareAtPrice ? cents(v.compareAtPrice.amount) : null,
      availableForSale: v.availableForSale,
    })),
    sellingPlans: p.sellingPlanGroups.nodes
      .flatMap((g) => g.sellingPlans.nodes)
      .map((sp) => ({
        id: sp.id,
        name: sp.name,
        days: planDays(sp.name, sp.options),
        discountPct: sp.priceAdjustments[0]?.adjustmentValue.adjustmentPercentage ?? 0,
      }))
      .sort((a, b) => a.days - b.days),
  }));
}

export interface CheckoutLine {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string;
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { checkoutUrl }
      userErrors { field message }
    }
  }
`;

/** Creates a Shopify cart and returns its hosted checkout URL. */
export async function createCheckout(lines: CheckoutLine[], buyerIp?: string): Promise<string> {
  const data = await storefront<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } }>(
    CART_CREATE,
    { input: { lines, buyerIdentity: { countryCode: "US" } } },
    { buyerIp },
  );
  const { cart, userErrors } = data.cartCreate;
  if (userErrors.length || !cart) throw new ShopifyError(userErrors.map((e) => e.message).join("; ") || "No cart");
  return cart.checkoutUrl;
}

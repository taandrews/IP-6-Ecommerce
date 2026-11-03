import "server-only";
import { getShopifySecrets } from "@/lib/aws/secrets";
import { shopifyAdminUrl, shopifyStoreDomain } from "./config";

/**
 * Shopify Admin API, for the staff portal: order and customer overview,
 * the pre-order discount, and privacy erasure. Orders, refunds, subscriptions
 * and discounts are managed in Shopify admin itself; the portal links there.
 */
const API_VERSION = "2025-07";


export { shopifyAdminUrl };

export async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${shopifyStoreDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": (await getShopifySecrets()).adminToken },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  return body.data as T;
}

const legacyId = (gid: string) => gid.split("/").pop()!;
export const orderAdminUrl = (gid: string) => `${shopifyAdminUrl()}/orders/${legacyId(gid)}`;
export const customerAdminUrl = (gid: string) => `${shopifyAdminUrl()}/customers/${legacyId(gid)}`;

// ---------------------------------------------------------------------------
// Orders overview
// ---------------------------------------------------------------------------

export interface OrderSummary {
  id: string;
  name: string;
  createdAt: string;
  customer: string;
  totalCents: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  test: boolean;
  url: string;
}

type OrderNode = {
  id: string;
  name: string;
  createdAt: string;
  test: boolean;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customer: { displayName: string } | null;
};

const ORDER_FIELDS = `id name createdAt test displayFinancialStatus displayFulfillmentStatus
  totalPriceSet { shopMoney { amount currencyCode } } customer { displayName }`;

function toSummary(o: OrderNode): OrderSummary {
  return {
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
    customer: o.customer?.displayName ?? "Guest",
    totalCents: Math.round(Number(o.totalPriceSet.shopMoney.amount) * 100),
    currency: o.totalPriceSet.shopMoney.currencyCode,
    financialStatus: (o.displayFinancialStatus ?? "").replace(/_/g, " ").toLowerCase(),
    fulfillmentStatus: o.displayFulfillmentStatus.replace(/_/g, " ").toLowerCase(),
    test: o.test,
    url: orderAdminUrl(o.id),
  };
}

export async function recentOrders(first = 20, search?: string): Promise<OrderSummary[]> {
  const data = await admin<{ orders: { nodes: OrderNode[] } }>(
    `query($first:Int!,$q:String){ orders(first:$first, sortKey:CREATED_AT, reverse:true, query:$q){ nodes{ ${ORDER_FIELDS} } } }`,
    { first, q: search || null },
  );
  return data.orders.nodes.map(toSummary);
}

export interface Overview {
  orders30d: number;
  revenue30dCents: number;
  unfulfilled: number;
  customers: number;
  activeSubscriptions: number | null;
}

export async function overview(): Promise<Overview> {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const data = await admin<{
    last30: { nodes: { totalPriceSet: { shopMoney: { amount: string } }; test: boolean }[] };
    unfulfilled: { count: number };
    customers: { count: number };
  }>(
    `query($since:String!){
      last30: orders(first:250, query:$since){ nodes{ test totalPriceSet{ shopMoney{ amount } } } }
      unfulfilled: ordersCount(query:"fulfillment_status:unfulfilled status:open"){ count }
      customers: customersCount{ count }
    }`,
    { since: `created_at:>=${since}` },
  );
  let activeSubscriptions: number | null = null;
  try {
    const s = await admin<{ subscriptionContracts: { nodes: { status: string }[] } }>(
      `{ subscriptionContracts(first:250){ nodes{ status } } }`,
    );
    activeSubscriptions = s.subscriptionContracts.nodes.filter((c) => c.status === "ACTIVE").length;
  } catch {
    // Contracts belong to the Shopify Subscriptions app; without that access the count is shown as unavailable.
  }
  const real = data.last30.nodes.filter((o) => !o.test);
  return {
    orders30d: real.length,
    revenue30dCents: real.reduce((s, o) => s + Math.round(Number(o.totalPriceSet.shopMoney.amount) * 100), 0),
    unfulfilled: data.unfulfilled.count,
    customers: data.customers.count,
    activeSubscriptions,
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  orders: number;
  spentCents: number;
  url: string;
}

export async function findCustomers(email: string): Promise<CustomerSummary[]> {
  const data = await admin<{
    customers: { nodes: { id: string; displayName: string; defaultEmailAddress: { emailAddress: string } | null; numberOfOrders: string; amountSpent: { amount: string } }[] };
  }>(
    `query($q:String!){ customers(first:10, query:$q){ nodes{ id displayName defaultEmailAddress{ emailAddress } numberOfOrders amountSpent{ amount } } } }`,
    { q: `email:${JSON.stringify(email)}` },
  );
  return data.customers.nodes.map((c) => ({
    id: c.id,
    name: c.displayName,
    email: c.defaultEmailAddress?.emailAddress ?? "",
    orders: Number(c.numberOfOrders),
    spentCents: Math.round(Number(c.amountSpent.amount) * 100),
    url: customerAdminUrl(c.id),
  }));
}

/**
 * Asks Shopify to erase a customer's personal data (Shopify's own GDPR flow;
 * it completes after the legal hold Shopify applies to recent orders).
 * Returns how many matching customer records were submitted.
 */
export async function requestShopifyErasure(email: string): Promise<number> {
  const matches = (await findCustomers(email)).filter((c) => c.email.toLowerCase() === email.toLowerCase());
  for (const c of matches) {
    const res = await admin<{ customerRequestDataErasure: { userErrors: { message: string }[] } }>(
      `mutation($id:ID!){ customerRequestDataErasure(customerId:$id){ userErrors{ message } } }`,
      { id: c.id },
    );
    const errs = res.customerRequestDataErasure.userErrors;
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
  }
  return matches.length;
}

// ---------------------------------------------------------------------------
// Pre-order discount (an automatic discount in Shopify)
// ---------------------------------------------------------------------------

export interface ShopifyAutomaticDiscount {
  id: string;
  title: string;
  status: string;
  percentage: number;
}

export async function getAutomaticDiscount(id: string): Promise<ShopifyAutomaticDiscount | null> {
  const data = await admin<{
    discountNode: {
      id: string;
      discount: { title?: string; status?: string; customerGets?: { value?: { percentage?: number } } } | null;
    } | null;
  }>(
    `query($id:ID!){ discountNode(id:$id){ id discount{ ... on DiscountAutomaticBasic{ title status customerGets{ value{ ... on DiscountPercentage{ percentage } } } } } } }`,
    { id },
  );
  const d = data.discountNode?.discount;
  if (!data.discountNode || !d?.title) return null;
  return { id: data.discountNode.id, title: d.title, status: d.status ?? "", percentage: Math.round((d.customerGets?.value?.percentage ?? 0) * 100) };
}

/** Sets the percentage and switches the discount on or off. */
export async function updateAutomaticDiscount(id: string, v: { active: boolean; discountPct: number; title: string }) {
  const res = await admin<{ discountAutomaticBasicUpdate: { userErrors: { message: string }[] } }>(
    `mutation($id:ID!,$d:DiscountAutomaticBasicInput!){ discountAutomaticBasicUpdate(id:$id, automaticBasicDiscount:$d){ userErrors{ message } } }`,
    {
      id,
      d: {
        title: v.title,
        startsAt: v.active ? new Date(Date.now() - 60_000).toISOString() : undefined,
        endsAt: v.active ? null : new Date().toISOString(),
        customerGets: { value: { percentage: v.discountPct / 100 }, items: { all: true } },
      },
    },
  );
  const errs = res.discountAutomaticBasicUpdate.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

// ---------------------------------------------------------------------------
// Verified purchase (reviews)
// ---------------------------------------------------------------------------

/**
 * True when a paid Shopify order with this number and email contains one of
 * the SKUs. The caller never tells the visitor the result, so the check can't
 * be used to learn whether someone ordered.
 */
export async function isVerifiedPurchase(orderNumber: string, email: string, skus: string[]): Promise<boolean> {
  const num = orderNumber.replace(/[^0-9]/g, "");
  if (!num) return false;
  const data = await admin<{
    orders: { nodes: { email: string | null; displayFinancialStatus: string | null; lineItems: { nodes: { sku: string | null }[] } }[] };
  }>(
    `query($q:String!){ orders(first:5, query:$q){ nodes{ email displayFinancialStatus lineItems(first:50){ nodes{ sku } } } } }`,
    { q: `name:#${num}` },
  );
  const wanted = new Set(skus);
  return data.orders.nodes.some(
    (o) =>
      o.email?.toLowerCase() === email.trim().toLowerCase() &&
      ["PAID", "PARTIALLY_REFUNDED"].includes(o.displayFinancialStatus ?? "") &&
      o.lineItems.nodes.some((l) => l.sku && wanted.has(l.sku)),
  );
}

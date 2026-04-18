export type Currency = "USD" | "CAD" | "GBP" | "AUD" | "EUR" | "INR";
export type Locale = "en" | "fr" | "de" | "hi";

export type ProductCategory = "supplement" | "skincare" | "filter";

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  format?: string;
  size?: string;
  priceCents: Record<Currency, number>;
  weightGrams: number;
  stripePriceId?: string;
  stripePriceIdSubscription?: Record<string, string>;
  inStock: boolean;
}

export interface Product {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  category: ProductCategory;
  heroClaim: string;
  highlights: string[];
  ingredients?: string[];
  specifications?: { label: string; value: string }[];
  howToUse: string[];
  variants: ProductVariant[];
  subscriptionCycles: { days: number; discountPct: number }[];
  images: { url: string; alt: string; width: number; height: number }[];
  faq: { q: string; a: string }[];
  relatedSkus: string[];
  requiresDsheaDisclaimer: boolean;
  shipsGlobally: boolean;
}

export interface CartLine {
  sku: string;
  variantId: string;
  name: string;
  variantLabel: string;
  image: string;
  qty: number;
  unitPriceCents: number;
  currency: Currency;
  subscription?: { cycleDays: number; discountPct: number };
}

export interface Address {
  id?: string;
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  orderId: string;
  userId?: string;
  email: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  items: CartLine[];
  shippingAddress: Address;
  billingAddress?: Address;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: Currency;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  reviewId: string;
  sku: string;
  userId?: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Subscription {
  subscriptionId: string;
  userId: string;
  stripeSubscriptionId: string;
  sku: string;
  variantId: string;
  cycleDays: number;
  status: "active" | "paused" | "cancelled" | "past_due";
  nextChargeDate: string;
  currency: Currency;
  priceCents: number;
  createdAt: string;
}

export interface DiscountCode {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotalCents?: number;
  maxUses?: number;
  usesCount: number;
  perUserLimit?: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface InventoryRecord {
  sku: string;
  stock: number;
  lowStockThreshold: number;
  lowStock?: "1";
  updatedAt: string;
}

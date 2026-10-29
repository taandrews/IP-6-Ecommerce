/**
 * Shapes of the records stored in DynamoDB. These are server-side types;
 * anything sent to a browser goes through a mapper that drops fields the
 * viewer is not allowed to see.
 */
import type { Address, Currency } from "./index";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "partially_refunded"
  | "refunded"
  | "failed";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "partially_refunded",
  "refunded",
  "failed",
];

export interface OrderLine {
  sku: string;
  variantId: string;
  name: string;
  variantLabel: string;
  qty: number;
  unitPriceCents: number;
  /** Percentage taken off this line (pre-order or subscription discount). */
  discountPct: number;
  lineTotalCents: number;
  preorder: boolean;
  subscriptionCycleDays?: number;
}

export interface OrderFulfillment {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippedAt: string;
  shippedBy: string;
}

export interface OrderRefund {
  refundId: string;
  amountCents: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderNote {
  at: string;
  by: string;
  text: string;
}

export interface OrderRecord {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  email: string;
  /** Lower-cased email, the key of the by-email index. */
  emailKey: string;
  userId?: string;
  customerName: string;
  phone?: string;
  shippingAddress: Address;
  items: OrderLine[];
  currency: Currency;
  subtotalCents: number;
  discountCode?: string;
  discountCents: number;
  shippingRateId: string;
  shippingLabel: string;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  /** "1" when any line is a pre-order; string so it can key a sparse index later. */
  preorder?: "1";
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  fulfillment?: OrderFulfillment;
  deliveredAt?: string;
  refundedCents: number;
  refunds: OrderRefund[];
  notes: OrderNote[];
  /** Epoch seconds; set on unpaid orders so abandoned checkouts expire. */
  expiresAt?: number;
  /** Set when the customer's personal data was erased on request. */
  anonymizedAt?: string;
  /** After-payment steps already done (stock, email, ...), so webhook retries pick up where a failure stopped. */
  doneSteps?: Set<string>;
}

export interface ProductOverride {
  sku: string;
  /** Per-variant prices in minor units, keyed by variant id then currency. */
  prices?: Record<string, Partial<Record<Currency, number>>>;
  /** Per-variant manual availability switch. */
  available?: Record<string, boolean>;
  updatedAt: string;
  updatedBy: string;
}

export interface InventoryItem {
  /** Variant SKU. */
  sku: string;
  stock: number;
  lowStockThreshold: number;
  /** Keep selling at zero stock (used while pre-orders are open). */
  allowBackorder: boolean;
  lowStock?: "1";
  updatedAt: string;
  updatedBy?: string;
}

export interface PreorderSettings {
  active: boolean;
  discountPct: number;
  label: string;
  shipNote: string;
}

export interface BannerSettings {
  enabled: boolean;
  text: string;
  linkHref?: string;
  linkLabel?: string;
  startsAt?: string;
  endsAt?: string;
}

export type DiscountType = "percentage" | "fixed";

export interface DiscountRecord {
  code: string;
  type: DiscountType;
  /** Percent (1-100) or fixed amount in minor units of `currency`. */
  value: number;
  currency?: Currency;
  minSubtotalCents?: number;
  maxUses?: number;
  usesCount: number;
  perCustomerLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  /** "1" or "0", the key of the active-codes index. */
  active: "1" | "0";
  description?: string;
  createdAt: string;
  createdBy: string;
}

export type ReviewStatus = "pending" | "published" | "rejected";

export interface ReviewRecord {
  sku: string;
  reviewId: string;
  status: ReviewStatus;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  userId?: string;
  verifiedPurchase: boolean;
  /** Claim-linter findings shown to moderators. */
  findings?: Array<{ severity: string; message: string }>;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  rejectReason?: string;
}

export type SubscriptionStatus = "active" | "trialing" | "paused" | "past_due" | "cancelled" | "incomplete";

export interface SubscriptionRecord {
  /** Stripe subscription id. */
  subscriptionId: string;
  status: SubscriptionStatus;
  userId?: string;
  email: string;
  emailKey: string;
  stripeCustomerId: string;
  sku: string;
  variantId: string;
  productName: string;
  cycleDays: number;
  priceCents: number;
  currency: Currency;
  nextChargeDate?: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
}

export type PrivacyRequestType = "export" | "delete";
export type PrivacyRequestStatus = "unverified" | "open" | "completed" | "rejected";

export interface PrivacyRequestRecord {
  requestId: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  email: string;
  emailKey: string;
  userId?: string;
  details?: string;
  /** SHA-256 of the emailed verification token; the token itself is never stored. */
  verifyTokenHash?: string;
  verifiedAt?: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  resolution?: string;
  expiresAt?: number;
}

export interface AuditEntry {
  /** Month bucket, e.g. "2026-10". */
  month: string;
  /** ISO timestamp plus a random suffix, so entries sort by time. */
  sk: string;
  at: string;
  actorSub: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target?: string;
  /** Non-sensitive context. Never holds addresses, payment or health data. */
  detail?: Record<string, string | number | boolean>;
  ip?: string;
  expiresAt: number;
}

export interface DailyStats {
  date: string;
  orders: number;
  preorders: number;
  units: number;
  /** Revenue in minor units, keyed by currency. */
  revenue: Partial<Record<Currency, number>>;
  refunds: Partial<Record<Currency, number>>;
}

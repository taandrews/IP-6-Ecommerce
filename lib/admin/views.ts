import "server-only";
import { can, type Role } from "@/lib/auth/roles";
import { maskAddress, maskEmail, maskName, maskPhone } from "./pii";
import type { OrderRecord, OrderStatus } from "@/types/records";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  partially_refunded: "Part refunded",
  refunded: "Refunded",
  failed: "Failed",
};

export const STATUS_TONE: Record<OrderStatus, "neutral" | "good" | "warn" | "bad" | "info"> = {
  pending: "neutral",
  paid: "warn",
  processing: "info",
  shipped: "good",
  delivered: "good",
  cancelled: "neutral",
  partially_refunded: "bad",
  refunded: "bad",
  failed: "bad",
};

export interface OrderRow {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  customer: string;
  email: string;
  items: number;
  totalCents: number;
  currency: OrderRecord["currency"];
  preorder: boolean;
  country: string;
}

/** The list view of an order, masked for roles without customers:pii. */
export function orderRow(o: OrderRecord, role: Role): OrderRow {
  const pii = can(role, "customers:pii");
  return {
    orderId: o.orderId,
    createdAt: o.createdAt,
    status: o.status,
    customer: pii ? o.customerName : maskName(o.customerName),
    email: pii ? o.email : maskEmail(o.email),
    items: o.items.reduce((n, l) => n + l.qty, 0),
    totalCents: o.totalCents,
    currency: o.currency,
    preorder: o.preorder === "1",
    country: o.shippingAddress?.country ?? "",
  };
}

/** Full order for the detail page, masked for roles without customers:pii. */
export function orderDetail(o: OrderRecord, role: Role) {
  if (can(role, "customers:pii")) return o;
  return {
    ...o,
    customerName: maskName(o.customerName),
    email: maskEmail(o.email),
    phone: maskPhone(o.phone),
    shippingAddress: maskAddress(o.shippingAddress) ?? o.shippingAddress,
  };
}

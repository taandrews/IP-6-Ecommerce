import "server-only";
import type { SessionUser } from "@/lib/auth/session";
import type { OrderRecord } from "@/types/records";
import { emailKey, getOrder, listOrdersByEmail, listOrdersByUser } from "./orders";

/** Orders a customer may see: placed while signed in, or with their verified email. Never pending ones. */
export async function getMyOrders(user: SessionUser): Promise<OrderRecord[]> {
  const [mine, byEmail] = await Promise.all([
    listOrdersByUser(user.sub, 200),
    user.emailVerified ? listOrdersByEmail(user.email, 200) : Promise.resolve([] as OrderRecord[]),
  ]);
  return [...new Map([...mine, ...byEmail].map((o) => [o.orderId, o])).values()]
    .filter((o) => o.status !== "pending" && o.status !== "failed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ownsOrder(o: OrderRecord, user: SessionUser) {
  if (o.userId && o.userId === user.sub) return true;
  return user.emailVerified && o.emailKey === emailKey(user.email);
}

export async function getMyOrder(user: SessionUser, orderId: string) {
  if (!/^IP6-[A-Z0-9]{6,20}$/.test(orderId)) return null;
  const o = await getOrder(orderId);
  if (!o || !ownsOrder(o, user) || o.status === "pending") return null;
  return o;
}

export const ORDER_STATUS_LABEL: Record<OrderRecord["status"], string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  partially_refunded: "Partly refunded",
  refunded: "Refunded",
  failed: "Payment failed",
};

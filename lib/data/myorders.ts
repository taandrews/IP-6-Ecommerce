import "server-only";
import type { SessionUser } from "@/lib/auth/session";
import type { OrderRecord } from "@/types/records";
import { emailKey, getOrder, listOrdersByEmail, listOrdersByUser } from "./orders";

/** A checkout that was never paid (pending, failed, or cancelled before payment) is not an order to show. */
function wasPlaced(o: OrderRecord) {
  return o.status !== "pending" && o.status !== "failed" && !(o.status === "cancelled" && !o.paidAt && !o.refundedCents);
}

/** Orders a customer may see: placed while signed in, or with their verified email. Never unpaid ones. */
export async function getMyOrders(user: SessionUser): Promise<OrderRecord[]> {
  const [mine, byEmail] = await Promise.all([
    listOrdersByUser(user.sub, 200),
    user.emailVerified ? listOrdersByEmail(user.email, 200) : Promise.resolve([] as OrderRecord[]),
  ]);
  return [...new Map([...mine, ...byEmail].map((o) => [o.orderId, o])).values()]
    .filter(wasPlaced)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ownsOrder(o: OrderRecord, user: SessionUser) {
  if (o.userId && o.userId === user.sub) return true;
  return user.emailVerified && o.emailKey === emailKey(user.email);
}

export async function getMyOrder(user: SessionUser, orderId: string) {
  if (!/^IP6-[A-Z0-9]{6,20}$/.test(orderId)) return null;
  const o = await getOrder(orderId);
  if (!o || !ownsOrder(o, user) || !wasPlaced(o)) return null;
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

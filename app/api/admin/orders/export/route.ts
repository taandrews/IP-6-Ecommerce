import { NextResponse } from "next/server";
import { withAdmin, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { listOrdersInRange } from "@/lib/data/orders";
import { toCsv } from "@/lib/admin/csv";
import { ORDER_STATUSES, type OrderStatus } from "@/types/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DAYS = 366;

/**
 * Owner-only CSV of orders in a date range. Contains personal data, so every
 * export is written to the activity log with its range and row count.
 */
export const GET = withAdmin("orders:export", async (req, staff) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new HttpError(400, "bad_range");
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  if (!(start <= end) || (end.getTime() - start.getTime()) / 86400000 > MAX_DAYS) throw new HttpError(400, "bad_range");
  const statusParam = url.searchParams.get("status");
  const statuses: OrderStatus[] =
    statusParam && ORDER_STATUSES.includes(statusParam as OrderStatus)
      ? [statusParam as OrderStatus]
      : ORDER_STATUSES.filter((s) => s !== "pending" && s !== "failed");

  const orders = (await Promise.all(statuses.map((s) => listOrdersInRange(s, start.toISOString(), end.toISOString()))))
    .flat()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const rows = orders.map((o) => [
    o.orderId,
    o.createdAt,
    o.status,
    o.customerName,
    o.email,
    o.phone ?? "",
    o.shippingAddress.line1,
    o.shippingAddress.line2 ?? "",
    o.shippingAddress.city,
    o.shippingAddress.region,
    o.shippingAddress.postalCode,
    o.shippingAddress.country,
    o.items.map((l) => `${l.sku} x${l.qty}`).join("; "),
    o.preorder === "1" ? "yes" : "no",
    o.currency,
    (o.subtotalCents / 100).toFixed(2),
    (o.discountCents / 100).toFixed(2),
    o.discountCode ?? "",
    (o.shippingCents / 100).toFixed(2),
    (o.taxCents / 100).toFixed(2),
    (o.totalCents / 100).toFixed(2),
    ((o.refundedCents ?? 0) / 100).toFixed(2),
    o.fulfillment?.carrier ?? "",
    o.fulfillment?.trackingNumber ?? "",
    o.fulfillment?.shippedAt ?? "",
  ]);
  const csv = toCsv(
    [
      "Order",
      "Created (UTC)",
      "Status",
      "Name",
      "Email",
      "Phone",
      "Address 1",
      "Address 2",
      "City",
      "Region",
      "Postal code",
      "Country",
      "Items",
      "Pre-order",
      "Currency",
      "Subtotal",
      "Discount",
      "Code",
      "Shipping",
      "Tax",
      "Total",
      "Refunded",
      "Carrier",
      "Tracking",
      "Shipped (UTC)",
    ],
    rows,
  );
  await audit(staff.actor, "orders.export", undefined, { from, to, rows: rows.length, status: statusParam ?? "all" }, staff.ip);
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ip6-orders-${from}-to-${to}.csv"`,
    },
  });
});

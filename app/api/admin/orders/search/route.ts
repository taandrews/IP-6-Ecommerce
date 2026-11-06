import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { getOrder, listOrdersByEmail } from "@/lib/data/orders";
import { orderRow } from "@/lib/admin/views";
import type { OrderRecord } from "@/types/records";

export const runtime = "nodejs";

const Body = z.object({ q: z.string().trim().min(3).max(254) });

/** Find orders by order number or customer email (sent in the body, never the URL). */
export const POST = withAdmin("orders:read", async (req, staff) => {
  const { q } = await parseBody(req, Body);
  const upper = q.toUpperCase();
  let orders: OrderRecord[] = [];
  if (/^IP6-[A-Z0-9]{6,20}$/.test(upper)) {
    const o = await getOrder(upper);
    orders = o && o.status !== "pending" ? [o] : [];
  } else if (q.includes("@")) {
    orders = (await listOrdersByEmail(q, 100)).filter((o) => o.status !== "pending");
    await audit(staff.actor, "orders.search_email", undefined, { results: orders.length }, staff.ip);
  }
  return NextResponse.json({ orders: orders.map((o) => orderRow(o, staff.role)) });
});

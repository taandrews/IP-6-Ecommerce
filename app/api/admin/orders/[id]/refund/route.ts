import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { refund } from "@/lib/orders/admin";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const Body = z.object({
  /** Omit for a full refund of what remains. */
  amountCents: z.number().int().positive().optional(),
  reason: z.string().trim().max(300).optional(),
  restock: z.boolean().default(false),
  /** Client-generated per click; makes a double submit refund only once. */
  requestKey: z.string().uuid(),
});

export const POST = withAdmin<{ id: string }>("orders:refund", async (req, staff, { id }) => {
  if (!/^IP6-[A-Z0-9]{6,20}$/.test(id)) throw new HttpError(404, "not_found");
  const b = await parseBody(req, Body);
  const r = await refund(await getStripe(), id, { amountCents: b.amountCents, reason: b.reason, restockItems: b.restock, requestKey: b.requestKey }, staff.user.email);
  await audit(staff.actor, "order.refund", id, { amountCents: r.amountCents, restock: b.restock }, staff.ip);
  return NextResponse.json({ ok: true, ...r });
});

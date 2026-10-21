import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { audit } from "@/lib/data/audit";
import { addNote, cancel, fulfil, markDelivered, markProcessing } from "@/lib/orders/admin";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("processing") }),
  z.object({
    action: z.literal("fulfill"),
    carrier: z.string().trim().min(2).max(60),
    trackingNumber: z.string().trim().min(4).max(60).regex(/^[A-Za-z0-9 -]+$/),
    // Only http(s) links: z.url() alone would accept javascript: and data: URLs.
    trackingUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "http(s) link required")
      .optional(),
    notify: z.boolean().default(true),
  }),
  z.object({ action: z.literal("deliver") }),
  z.object({ action: z.literal("note"), text: z.string().trim().min(1).max(1000) }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(3).max(300), requestKey: z.string().uuid() }),
]);

const ORDER_ID = /^IP6-[A-Z0-9]{6,20}$/;

/** Order actions. Fulfilment needs orders:fulfill; cancelling (a refund) needs orders:refund. */
export const POST = withAdmin<{ id: string }>("orders:fulfill", async (req, staff, { id }) => {
  if (!ORDER_ID.test(id)) throw new HttpError(404, "not_found");
  const b = await parseBody(req, Body);
  switch (b.action) {
    case "processing":
      await markProcessing(id);
      break;
    case "fulfill":
      await fulfil(id, { carrier: b.carrier, trackingNumber: b.trackingNumber, trackingUrl: b.trackingUrl || undefined }, staff.user.email, b.notify);
      break;
    case "deliver":
      await markDelivered(id);
      break;
    case "note":
      await addNote(id, b.text, staff.user.email);
      break;
    case "cancel":
      if (!can(staff.role, "orders:refund")) throw new HttpError(403, "forbidden");
      await cancel(await getStripe(), id, b.reason, staff.user.email, b.requestKey);
      break;
  }
  await audit(staff.actor, `order.${b.action}`, id, b.action === "fulfill" ? { carrier: b.carrier, notified: b.notify } : undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { getSubscription } from "@/lib/data/subscriptions";
import { applySubscriptionOp } from "@/lib/subscriptions/ops";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const Body = z.object({ op: z.enum(["pause", "resume", "skip", "cancel"]) });

export const POST = withAdmin<{ id: string }>("subscriptions:manage", async (req, staff, { id }) => {
  if (!/^sub_[A-Za-z0-9]{8,64}$/.test(id)) throw new HttpError(404, "not_found");
  const { op } = await parseBody(req, Body);
  const rec = await getSubscription(id);
  if (!rec) throw new HttpError(404, "not_found");
  if (rec.status === "cancelled") throw new HttpError(409, "already_cancelled");
  const updated = await applySubscriptionOp(await getStripe(), rec, op);
  await audit(staff.actor, `subscription.${op}`, id, undefined, staff.ip);
  return NextResponse.json({ ok: true, status: updated.status, nextChargeDate: updated.nextChargeDate });
});

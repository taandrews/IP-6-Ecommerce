import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { savePreorderSettings } from "@/lib/data/settings";

export const runtime = "nodejs";

const Body = z.object({
  active: z.boolean(),
  discountPct: z.number().int().min(0).max(50),
  label: z.string().trim().min(2).max(30),
  shipNote: z.string().trim().min(5).max(120),
});

/** Turns the pre-order window and its discount on or off for the whole store. */
export const PUT = withAdmin("preorder:manage", async (req, staff) => {
  const b = await parseBody(req, Body);
  await savePreorderSettings(b, staff.user.email);
  await audit(staff.actor, "settings.preorder", undefined, { active: b.active, discountPct: b.discountPct }, staff.ip);
  return NextResponse.json({ ok: true });
});

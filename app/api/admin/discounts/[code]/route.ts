import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { deleteDiscount, expireDiscount, getDiscount, normalizeCode, setDiscountActive } from "@/lib/data/discounts";

export const runtime = "nodejs";

const Body = z.object({ action: z.enum(["activate", "deactivate", "expire"]) });

export const PATCH = withAdmin<{ code: string }>("discounts:write", async (req, staff, { code: raw }) => {
  const code = normalizeCode(decodeURIComponent(raw));
  const { action } = await parseBody(req, Body);
  if (!(await getDiscount(code))) throw new HttpError(404, "not_found");
  if (action === "expire") await expireDiscount(code);
  else await setDiscountActive(code, action === "activate");
  await audit(staff.actor, `discount.${action}`, code, undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

/** Only never-used codes can be deleted; used ones are expired instead so order history stays explainable. */
export const DELETE = withAdmin<{ code: string }>("discounts:write", async (_req, staff, { code: raw }) => {
  const code = normalizeCode(decodeURIComponent(raw));
  const d = await getDiscount(code);
  if (!d) throw new HttpError(404, "not_found");
  if (d.usesCount > 0) throw new HttpError(409, "in_use");
  await deleteDiscount(code);
  await audit(staff.actor, "discount.delete", code, undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

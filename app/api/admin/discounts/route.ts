import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { createDiscount, normalizeCode } from "@/lib/data/discounts";
import { CurrencySchema } from "@/lib/checkout/schema";

export const runtime = "nodejs";

const Body = z
  .object({
    code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().int().positive(),
    currency: CurrencySchema.optional(),
    minSubtotalCents: z.number().int().min(0).optional(),
    maxUses: z.number().int().positive().optional(),
    perCustomerLimit: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    description: z.string().trim().max(120).optional(),
  })
  .refine((d) => d.type !== "percentage" || d.value <= 100, { message: "percent over 100" })
  .refine((d) => d.type !== "fixed" || !!d.currency, { message: "fixed needs currency" })
  .refine((d) => !d.startsAt || !d.expiresAt || new Date(d.startsAt) < new Date(d.expiresAt), { message: "bad dates" });

export const POST = withAdmin("discounts:write", async (req, staff) => {
  const b = await parseBody(req, Body);
  const code = normalizeCode(b.code);
  try {
    await createDiscount({
      code,
      type: b.type,
      value: b.value,
      ...(b.type === "fixed" ? { currency: b.currency } : {}),
      ...(b.minSubtotalCents ? { minSubtotalCents: b.minSubtotalCents } : {}),
      ...(b.maxUses ? { maxUses: b.maxUses } : {}),
      ...(b.perCustomerLimit ? { perCustomerLimit: b.perCustomerLimit } : {}),
      ...(b.startsAt ? { startsAt: b.startsAt } : {}),
      ...(b.expiresAt ? { expiresAt: b.expiresAt } : {}),
      ...(b.description ? { description: b.description } : {}),
      usesCount: 0,
      active: "1",
      createdAt: new Date().toISOString(),
      createdBy: staff.user.email,
    });
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") throw new HttpError(409, "code_exists");
    throw err;
  }
  await audit(staff.actor, "discount.create", code, { type: b.type, value: b.value }, staff.ip);
  return NextResponse.json({ ok: true, code });
});

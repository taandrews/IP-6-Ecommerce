import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { moderateReview } from "@/lib/data/reviews";

export const runtime = "nodejs";

const Body = z.object({
  sku: z.string().min(3).max(60),
  reviewId: z.string().regex(/^rev_[A-Za-z0-9_-]{6,40}$/),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(200).optional(),
});

export const POST = withAdmin("reviews:moderate", async (req, staff) => {
  const b = await parseBody(req, Body);
  try {
    await moderateReview(b.sku, b.reviewId, b.action === "approve" ? "published" : "rejected", staff.user.email, b.reason);
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") throw new HttpError(404, "not_found");
    throw err;
  }
  await audit(staff.actor, `review.${b.action}`, b.reviewId, undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

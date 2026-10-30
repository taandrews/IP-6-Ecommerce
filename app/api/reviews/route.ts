import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { lintContent } from "@/lib/compliance/claim-linter";
import { createReview } from "@/lib/data/reviews";
import { getSessionUser } from "@/lib/auth/session";
import { listOrdersByUser, PAID_STATUSES } from "@/lib/data/orders";
import { products } from "@/content/products";
import { limitByIp } from "@/lib/rate-limit";
import { isBot } from "@/lib/honeypot";
import { verifyCaptcha } from "@/lib/captcha";

export const runtime = "nodejs";

const Body = z.object({
  sku: z.string().min(3).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(2000),
  authorName: z.string().trim().min(1).max(60),
  website: z.string().max(200).optional(),
  captcha: z.string().max(2048).nullish(),
});

/**
 * Every review waits for staff approval before it is shown (health-product
 * reviews must not make disease claims). Claim-linter findings are stored
 * for the moderator.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "reviews", 3)) ?? (await limitByIp(req, "reviews-day", 10, 86400));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete every field." }, { status: 400 });
  if (isBot(parsed.data.website)) return NextResponse.json({ ok: true, status: "pending" });
  if (!(await verifyCaptcha(parsed.data.captcha, req))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400 });
  }
  const product = products.find((p) => p.sku === parsed.data.sku);
  if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 400 });

  const category = product.category === "pet" ? "supplement" : (product.category as "supplement" | "skincare" | "filter");
  const findings = lintContent(`${parsed.data.title} ${parsed.data.body}`, category).map((f) => ({
    severity: String(f.severity),
    message: `${f.rule}: ${f.match}`,
  }));

  const user = await getSessionUser();
  let verifiedPurchase = false;
  if (user) {
    const orders = await listOrdersByUser(user.sub, 100).catch(() => []);
    const variantSkus = new Set(product.variants.map((v) => v.sku));
    verifiedPurchase = orders.some((o) => PAID_STATUSES.includes(o.status) && o.items.some((l) => variantSkus.has(l.sku)));
  }

  try {
    await createReview({
      sku: product.sku,
      reviewId: `rev_${crypto.randomBytes(9).toString("base64url")}`,
      status: "pending",
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      authorName: parsed.data.authorName,
      ...(user ? { userId: user.sub } : {}),
      verifiedPurchase,
      ...(findings.length ? { findings } : {}),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (err) {
    console.error("[reviews] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save your review. Please try again." }, { status: 500 });
  }
}

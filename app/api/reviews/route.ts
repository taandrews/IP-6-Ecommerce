import { NextResponse } from "next/server";
import { z } from "zod";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { lintContent } from "@/lib/compliance/claim-linter";
import { cuid } from "@/lib/utils";

const Body = z.object({
  sku: z.string().min(3),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  authorName: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const category = parsed.data.sku.startsWith("SUP-")
    ? "supplement"
    : parsed.data.sku.startsWith("SKN-")
      ? "skincare"
      : parsed.data.sku.startsWith("FIL-")
        ? "filter"
        : "general";

  const findings = lintContent(
    `${parsed.data.title} ${parsed.data.body}`,
    category as "supplement" | "skincare" | "filter" | "general",
  );
  const hasError = findings.some((f) => f.severity === "error");
  const status = hasError ? "needs_review" : "published";

  const reviewId = `rev_${cuid()}`;
  const review = {
    reviewId,
    sku: parsed.data.sku,
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    verifiedPurchase: false,
    status,
    findings: findings.length > 0 ? findings : undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    await docClient.send(new PutCommand({ TableName: TABLES.Reviews, Item: review }));
  } catch (err) {
    // Still return the review optimistically so the UI shows it; log for ops.
    console.error("[reviews] dynamo put failed", err);
  }

  return NextResponse.json({ review });
}

import { NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { requireAdmin } from "@/lib/auth/session";
import { z } from "zod";

const Body = z.object({
  code: z.string().min(3).max(40),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(1),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().default(true),
});

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.DiscountCodes, Limit: 500 }),
    );
    return NextResponse.json({ codes: Items ?? [] });
  } catch {
    return NextResponse.json({ codes: [] });
  }
}

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const code = {
    ...parsed.data,
    code: parsed.data.code.toUpperCase(),
    usesCount: 0,
    createdAt: new Date().toISOString(),
  };
  try {
    await docClient.send(new PutCommand({ TableName: TABLES.DiscountCodes, Item: code }));
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

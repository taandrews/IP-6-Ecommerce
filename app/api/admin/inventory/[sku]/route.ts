import { NextResponse } from "next/server";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { requireAdmin } from "@/lib/auth/session";
import { z } from "zod";

const Body = z.object({ stock: z.number().int().min(0) });

export async function PATCH(req: Request, { params }: { params: { sku: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const LOW = 25;
  const low = parsed.data.stock <= LOW;
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Inventory,
        Key: { sku: params.sku },
        UpdateExpression: "SET stock = :s, updatedAt = :u, lowStockThreshold = :t"
          + (low ? ", lowStock = :one" : " REMOVE lowStock"),
        ExpressionAttributeValues: {
          ":s": parsed.data.stock,
          ":u": new Date().toISOString(),
          ":t": LOW,
          ...(low ? { ":one": "1" } : {}),
        },
      }),
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

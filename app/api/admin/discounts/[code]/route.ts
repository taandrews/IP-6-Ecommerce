import { NextResponse } from "next/server";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { requireAdmin } from "@/lib/auth/session";

export async function DELETE(_req: Request, { params }: { params: { code: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLES.DiscountCodes,
        Key: { code: params.code.toUpperCase() },
      }),
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}

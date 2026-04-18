import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.Users, Limit: 500 }),
    );
    return NextResponse.json({ customers: Items ?? [] });
  } catch {
    return NextResponse.json({ customers: [] });
  }
}

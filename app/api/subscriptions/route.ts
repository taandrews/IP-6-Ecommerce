import { NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: TABLES.Subscriptions,
        IndexName: "GSI1",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": user.sub },
      }),
    );
    return NextResponse.json({ subscriptions: Items ?? [] });
  } catch {
    return NextResponse.json({ subscriptions: [] });
  }
}

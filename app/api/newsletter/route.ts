import { NextResponse } from "next/server";
import { z } from "zod";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.Users,
        Item: {
          userId: `newsletter_${parsed.data.email}`,
          email: parsed.data.email,
          newsletter: true,
          createdAt: new Date().toISOString(),
        },
      }),
    );
  } catch {
    /* noop */
  }
  return NextResponse.json({ ok: true });
}

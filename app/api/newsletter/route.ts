import { NextResponse } from "next/server";
import { z } from "zod";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailKey } from "@/lib/data/orders";
import { newsletterKey } from "@/lib/data/customers";

export const runtime = "nodejs";

/** The exact wording shown next to the sign-up checkbox; stored as proof of consent. */
const CONSENT_VERSION = "2026-10-20";

const Body = z.object({
  email: z.string().trim().email().max(254),
  consent: z.literal(true),
  source: z.enum(["prebook_popup", "footer", "account"]).default("prebook_popup"),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please tick the box to agree to emails." }, { status: 400 });
  try {
    const now = new Date().toISOString();
    await docClient.send(
      new PutCommand({
        TableName: TABLES.Users,
        Item: {
          userId: newsletterKey(parsed.data.email),
          email: emailKey(parsed.data.email),
          newsletter: true,
          consentedAt: now,
          consentVersion: CONSENT_VERSION,
          source: parsed.data.source,
          createdAt: now,
        },
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}

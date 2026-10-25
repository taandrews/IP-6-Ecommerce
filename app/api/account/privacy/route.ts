import { NextResponse } from "next/server";
import { z } from "zod";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { getSessionUser } from "@/lib/auth/session";
import { newsletterKey } from "@/lib/data/customers";
import { createPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { EMAIL } from "@/lib/email-addresses";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unsubscribe") }),
  z.object({ action: z.literal("delete"), details: z.string().trim().max(2000).optional() }),
]);

/** Signed-in privacy controls: stop marketing emails, or ask for account deletion. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    if (parsed.data.action === "unsubscribe") {
      await docClient.send(new DeleteCommand({ TableName: TABLES.Users, Key: { userId: newsletterKey(user.email) } }));
      return NextResponse.json({ ok: true });
    }
    // Signed in with a verified email, so the request counts as verified.
    if (!user.emailVerified) return NextResponse.json({ error: "Verify your email first, or use the form on our Privacy Policy page." }, { status: 403 });
    await createPrivacyRequest({ type: "delete", email: user.email, userId: user.sub, details: parsed.data.details, verified: true });
    await sendEmailSafe(user.email, emailTemplates.privacyReceived("delete"), "privacy received");
    await sendEmailSafe(EMAIL.privacy, emailTemplates.staffPrivacyAlert("delete"), "privacy staff alert");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account] privacy action failed", (err as Error).name);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

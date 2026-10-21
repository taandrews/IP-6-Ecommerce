import { NextResponse } from "next/server";
import { verifyPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Link from the verification email. Opens the request for staff and confirms to the requester. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const back = new URL("/legal/privacy", url.origin);
  if (!/^pr_[A-Za-z0-9_-]{8,20}$/.test(id) || token.length < 20 || token.length > 100) {
    back.searchParams.set("request", "invalid");
    return NextResponse.redirect(back, { status: 303 });
  }
  try {
    const rec = await verifyPrivacyRequest(id, token);
    if (!rec) {
      back.searchParams.set("request", "invalid");
      return NextResponse.redirect(back, { status: 303 });
    }
    await sendEmailSafe(rec.email, emailTemplates.privacyReceived(rec.type), "privacy received");
    const inbox = process.env.SES_REPLY_TO;
    if (inbox) await sendEmailSafe(inbox, emailTemplates.staffPrivacyAlert(rec.type), "privacy staff alert");
    back.searchParams.set("request", "confirmed");
  } catch (err) {
    console.error("[privacy] verify failed", (err as Error).name);
    back.searchParams.set("request", "error");
  }
  const res = NextResponse.redirect(back, { status: 303 });
  // The token is single-use; don't let it leak through the Referer header.
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

import { NextResponse } from "next/server";
import { verifyPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { EMAIL } from "@/lib/email-addresses";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^pr_[A-Za-z0-9_-]{8,20}$/;
const TOKEN = /^[A-Za-z0-9_-]{20,100}$/;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Link from the verification email. Opening it changes nothing: mail
 * scanners (Safe Links and the like) open every link in an email, so the
 * request is only confirmed when the person presses the button, which posts
 * back here. The page is self-contained, with no analytics that could see the
 * token in the address.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!ID.test(id) || !TOKEN.test(token)) return back(url, "invalid");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Confirm your privacy request | IP6 Original</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F9FB;color:#001840;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px;box-sizing:border-box}
main{max-width:440px;background:#fff;border:1px solid #E8EDF3;border-radius:12px;padding:32px}
h1{font-size:22px;margin:0 0 12px;color:#001840}p{margin:0 0 20px;color:#334766}
button{background:#001840;color:#fff;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#0C2C5E}
</style></head><body><main>
<h1>Confirm your privacy request</h1>
<p>Press the button to confirm you asked for this. Nothing happens until you do.</p>
<form method="post" action="/api/privacy/verify">
<input type="hidden" name="id" value="${escape(id)}"><input type="hidden" name="token" value="${escape(token)}">
<button type="submit">Confirm my request</button>
</form></main></body></html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** The button on the page above. Opens the request for staff and confirms to the requester. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const limited = await limitByIp(req, "privacy-verify", 10);
  if (limited) return limited;
  const form = await req.formData().catch(() => null);
  const id = String(form?.get("id") ?? "");
  const token = String(form?.get("token") ?? "");
  if (!ID.test(id) || !TOKEN.test(token)) return back(url, "invalid");
  try {
    const rec = await verifyPrivacyRequest(id, token);
    if (!rec) return back(url, "invalid");
    await sendEmailSafe(rec.email, emailTemplates.privacyReceived(rec.type), "privacy received");
    await sendEmailSafe(EMAIL.privacy, emailTemplates.staffPrivacyAlert(rec.type), "privacy staff alert");
    return back(url, "confirmed");
  } catch (err) {
    console.error("[privacy] verify failed", (err as Error).name);
    return back(url, "error");
  }
}

function back(url: URL, request: "confirmed" | "invalid" | "error") {
  const to = new URL("/legal/privacy", url.origin);
  to.searchParams.set("request", request);
  const res = NextResponse.redirect(to, { status: 303 });
  // The token is single-use; don't let it leak through the Referer header.
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

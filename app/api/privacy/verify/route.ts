import { verifyPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { EMAIL } from "@/lib/email-addresses";
import { limitByIp } from "@/lib/rate-limit";
import { confirmPage, redirectAfter } from "@/lib/confirm-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^pr_[A-Za-z0-9_-]{8,20}$/;
const TOKEN = /^[A-Za-z0-9_-]{20,100}$/;

const back = (url: URL, request: "confirmed" | "invalid" | "error") => redirectAfter(url, "/legal/privacy", { request });

/**
 * Link from the verification email. Opening it changes nothing: mail
 * scanners (Safe Links and the like) open every link in an email, so the
 * request is only confirmed when the person presses the button.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!ID.test(id) || !TOKEN.test(token)) return back(url, "invalid");
  return confirmPage({
    title: "Confirm your privacy request",
    text: "Press the button to confirm you asked for this. Nothing happens until you do.",
    button: "Confirm my request",
    action: "/api/privacy/verify",
    fields: { id, token },
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

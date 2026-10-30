import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { emailKey } from "@/lib/data/orders";
import { hit, limitByIp } from "@/lib/rate-limit";
import { isBot } from "@/lib/honeypot";
import { verifyCaptcha } from "@/lib/captcha";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  type: z.enum(["delete", "export"]).default("delete"),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(200).optional(),
  altcha: z.string().max(2048).optional(),
});

/**
 * Public privacy request (no account needed). Nothing happens until the
 * requester clicks the link sent to that email address, which proves they
 * control it. The reply is the same whatever the email, so the form can't be
 * used to find out who is a customer. Each address gets at most one email an
 * hour, so the form can't be used to flood someone's inbox.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "privacy", 3)) ?? (await limitByIp(req, "privacy-hour", 10, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (isBot(parsed.data.website)) return NextResponse.json({ ok: true });
  if (!(await verifyCaptcha(parsed.data.altcha))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400 });
  }
  if (!(await hit(`privacy-mail:${emailKey(parsed.data.email)}`, 1, 3600))) return NextResponse.json({ ok: true });
  try {
    const { record, token } = await createPrivacyRequest({
      type: parsed.data.type,
      email: parsed.data.email,
      details: parsed.data.details || undefined,
      verified: false,
    });
    // Never build an emailed link from the request's Host header (it can be spoofed
    // to send the token to another site). Production uses the configured origin.
    const configured = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (!configured && process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
    const site = configured ?? new URL(req.url).origin;
    const link = `${site}/api/privacy/verify?id=${encodeURIComponent(record.requestId)}&token=${encodeURIComponent(token!)}`;
    await sendEmailSafe(parsed.data.email, emailTemplates.privacyVerify(link, parsed.data.type), "privacy verify");
  } catch (err) {
    console.error("[privacy] request failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't record your request. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

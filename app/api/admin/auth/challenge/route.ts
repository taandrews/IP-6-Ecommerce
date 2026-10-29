import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { confirmTotpEnrolment, respondToChallenge, startTotpEnrolment } from "@/lib/aws/cognito";
import { readChallengeCookie, setChallengeCookie } from "@/lib/auth/session";
import { authErrorMessage, challengeKind, completeAuth } from "@/lib/auth/signin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NEW_PASSWORD"), newPassword: z.string().min(12).max(256) }),
  z.object({ type: z.literal("MFA"), code: z.string().regex(/^\d{6}$/) }),
  z.object({ type: z.literal("MFA_SETUP_START") }),
  z.object({ type: z.literal("MFA_SETUP_VERIFY"), code: z.string().regex(/^\d{6}$/) }),
]);

/**
 * Staff sign-in steps after the password: set a first password (invited
 * staff), enrol an authenticator app (first sign-in), or enter the 6-digit
 * code. The Cognito session for the step lives only in an httpOnly,
 * SameSite=Strict cookie that expires after 5 minutes.
 */
export async function POST(req: Request) {
  const limited = await limitByIp(req, "staff-challenge", 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check what you entered." }, { status: 400 });
  const pending = readChallengeCookie("staff");
  if (!pending) return NextResponse.json({ error: "Your sign-in timed out. Please sign in again.", restart: true }, { status: 401 });
  const kind = challengeKind(pending.name);
  const body = parsed.data;

  const expected =
    body.type === "NEW_PASSWORD" ? "NEW_PASSWORD" : body.type === "MFA" ? "MFA" : "MFA_SETUP";
  if (kind !== expected) return NextResponse.json({ error: "Unexpected step. Please sign in again.", restart: true }, { status: 400 });

  try {
    if (body.type === "MFA_SETUP_START") {
      const { secret, session } = await startTotpEnrolment(pending.session);
      setChallengeCookie({ ...pending, session }, "staff");
      const label = encodeURIComponent(`IP6 Original Admin:${pending.email}`);
      const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("IP6 Original Admin")}`;
      const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
      return NextResponse.json({ secret, qr }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.type === "MFA_SETUP_VERIFY") {
      const session = await confirmTotpEnrolment(pending.session, body.code);
      if (!session) return NextResponse.json({ error: "That code is incorrect. Use the latest code from your app." }, { status: 401 });
      const res = await respondToChallenge("staff", "MFA_SETUP", session, pending.username, {});
      const out = await completeAuth("staff", res, pending);
      if (out.status === "error") return NextResponse.json({ error: out.error }, { status: out.httpStatus });
      if (out.status === "challenge") return NextResponse.json({ challenge: out.challenge });
      return NextResponse.json({ ok: true, next: out.next });
    }

    const responses: Record<string, string> =
      body.type === "NEW_PASSWORD" ? { NEW_PASSWORD: body.newPassword } : { SOFTWARE_TOKEN_MFA_CODE: body.code };
    const res = await respondToChallenge("staff", pending.name, pending.session, pending.username, responses);
    const out = await completeAuth("staff", res, pending);
    if (out.status === "error") return NextResponse.json({ error: out.error }, { status: out.httpStatus });
    if (out.status === "challenge") return NextResponse.json({ challenge: out.challenge });
    return NextResponse.json({ ok: true, next: out.next });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    return NextResponse.json({ error }, { status: httpStatus });
  }
}

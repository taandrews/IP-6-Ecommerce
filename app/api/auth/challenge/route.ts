import { NextResponse } from "next/server";
import { z } from "zod";
import { respondToChallenge } from "@/lib/aws/cognito";
import { readChallengeCookie } from "@/lib/auth/session";
import { authErrorMessage, completeAuth } from "@/lib/auth/signin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({ type: z.literal("NEW_PASSWORD"), newPassword: z.string().min(8).max(256) });

/** Customer second sign-in step: choose a new password when Cognito requires one. */
export async function POST(req: Request) {
  const limited = await limitByIp(req, "challenge", 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check what you entered." }, { status: 400 });
  const pending = readChallengeCookie("customer");
  if (!pending || pending.name !== "NEW_PASSWORD_REQUIRED") {
    return NextResponse.json({ error: "Your sign-in timed out. Please sign in again.", restart: true }, { status: 401 });
  }
  try {
    const res = await respondToChallenge("customer", pending.name, pending.session, pending.username, { NEW_PASSWORD: parsed.data.newPassword });
    const out = await completeAuth("customer", res, { username: pending.username, email: pending.email, next: pending.next });
    if (out.status === "error") return NextResponse.json({ error: out.error }, { status: out.httpStatus });
    if (out.status === "challenge") return NextResponse.json({ challenge: out.challenge });
    return NextResponse.json({ ok: true, next: out.next });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    return NextResponse.json({ error }, { status: httpStatus });
  }
}

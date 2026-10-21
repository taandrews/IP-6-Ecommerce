import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/lib/aws/cognito";
import { authErrorMessage, completeAuth } from "@/lib/auth/signin";
import { safeNextPath } from "@/lib/auth/redirect";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  next: z.string().max(512).optional(),
});

/** Staff sign-in against the separate staff user pool (MFA required). */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const { email, password } = parsed.data;
  const next = safeNextPath(parsed.data.next, "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  try {
    const res = await signIn(email, password, "staff");
    const out = await completeAuth("staff", res, { username: email, email, next: safeNext });
    if (out.status === "error") return NextResponse.json({ error: out.error }, { status: out.httpStatus });
    if (out.status === "challenge") return NextResponse.json({ challenge: out.challenge });
    return NextResponse.json({ ok: true, next: out.next });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    // Unexpected failures (not a Cognito auth outcome) are logged server-side so operators can diagnose them.
    if (httpStatus === 500) console.error("staff sign-in failed:", (err as Error)?.name, (err as Error)?.message);
    return NextResponse.json({ error }, { status: httpStatus });
  }
}

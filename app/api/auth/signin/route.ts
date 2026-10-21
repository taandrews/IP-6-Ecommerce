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

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const { email, password } = parsed.data;
  const next = safeNextPath(parsed.data.next);
  try {
    const res = await signIn(email, password, "customer");
    const out = await completeAuth("customer", res, { username: email, email, next });
    if (out.status === "error") return NextResponse.json({ error: out.error }, { status: out.httpStatus });
    if (out.status === "challenge") return NextResponse.json({ challenge: out.challenge });
    return NextResponse.json({ ok: true, next: out.next });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    return NextResponse.json({ error }, { status: httpStatus });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmForgotPassword } from "@/lib/aws/cognito";
import { authErrorMessage } from "@/lib/auth/signin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  const limited = await limitByIp(req, "reset", 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check what you entered." }, { status: 400 });
  try {
    await confirmForgotPassword(parsed.data.email, parsed.data.code, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    // An unknown email reads as a wrong code, never as "no such account".
    if (httpStatus === 401) return NextResponse.json({ error: "That code didn't work. Request a new one and try again." }, { status: 400 });
    return NextResponse.json({ error: httpStatus === 500 ? "Reset failed. Please try again." : error }, { status: httpStatus });
  }
}

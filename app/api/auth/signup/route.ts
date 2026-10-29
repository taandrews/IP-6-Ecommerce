import { NextResponse } from "next/server";
import { z } from "zod";
import { signUp } from "@/lib/aws/cognito";
import { authErrorMessage } from "@/lib/auth/signin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(80),
});

export async function POST(req: Request) {
  const limited = (await limitByIp(req, "signup", 5)) ?? (await limitByIp(req, "signup-hour", 20, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check what you entered." }, { status: 400 });
  try {
    await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // An existing account gets the same reply as a new one, so sign-up can't
    // be used to find out who has an account.
    if ((err as Error)?.name === "UsernameExistsException") return NextResponse.json({ ok: true });
    const { error, httpStatus } = authErrorMessage(err);
    return NextResponse.json({ error: httpStatus === 500 ? "Sign up failed. Please try again." : error }, { status: httpStatus });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmForgotPassword, forgotPassword } from "@/lib/aws/cognito";
import { authErrorMessage } from "@/lib/auth/signin";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("step", [
  z.object({ step: z.literal("request"), email: z.string().trim().email().max(254) }),
  z.object({
    step: z.literal("confirm"),
    email: z.string().trim().email().max(254),
    code: z.string().regex(/^\d{6}$/),
    newPassword: z.string().min(12).max(256),
  }),
]);

/** Staff password reset. Always reports success on the first step so it can't reveal who is staff. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check what you entered." }, { status: 400 });
  const b = parsed.data;
  if (b.step === "request") {
    await forgotPassword(b.email, "staff").catch(() => undefined);
    return NextResponse.json({ ok: true });
  }
  try {
    await confirmForgotPassword(b.email, b.code, b.newPassword, "staff");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, httpStatus } = authErrorMessage(err);
    return NextResponse.json({ error }, { status: httpStatus });
  }
}

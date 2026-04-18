import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmForgotPassword } from "@/lib/aws/cognito";

const Body = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await confirmForgotPassword(parsed.data.email, parsed.data.code, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? "Reset failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

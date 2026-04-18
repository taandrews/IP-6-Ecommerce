import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmSignUp } from "@/lib/aws/cognito";

const Body = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await confirmSignUp(parsed.data.email, parsed.data.code);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? "Confirmation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

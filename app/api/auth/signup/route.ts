import { NextResponse } from "next/server";
import { z } from "zod";
import { signUp } from "@/lib/aws/cognito";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? "Sign up failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

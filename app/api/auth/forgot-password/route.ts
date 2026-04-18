import { NextResponse } from "next/server";
import { z } from "zod";
import { forgotPassword } from "@/lib/aws/cognito";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await forgotPassword(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch {
    // Always return 200 to avoid user enumeration
    return NextResponse.json({ ok: true });
  }
}

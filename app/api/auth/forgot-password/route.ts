import { NextResponse } from "next/server";
import { z } from "zod";
import { forgotPassword } from "@/lib/aws/cognito";
import { limitByIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().trim().email().max(254), captcha: z.string().max(2048).optional() });

export async function POST(req: Request) {
  const limited = (await limitByIp(req, "forgot", 5)) ?? (await limitByIp(req, "forgot-hour", 20, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!(await verifyCaptcha(parsed.data.captcha, req))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400 });
  }
  try {
    await forgotPassword(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch {
    // Always return 200 to avoid user enumeration
    return NextResponse.json({ ok: true });
  }
}

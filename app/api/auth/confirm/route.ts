import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmSignUp } from "@/lib/aws/cognito";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
});

const CODE_ERRORS = new Set(["CodeMismatchException", "ExpiredCodeException", "NotAuthorizedException", "UserNotFoundException"]);

export async function POST(req: Request) {
  const limited = await limitByIp(req, "confirm", 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code from the email." }, { status: 400 });
  try {
    await confirmSignUp(parsed.data.email, parsed.data.code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const name = (err as Error)?.name ?? "";
    if (name === "TooManyRequestsException" || name === "LimitExceededException" || name === "TooManyFailedAttemptsException") {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
    }
    // One message for a wrong code, an unknown email or an account that's
    // already confirmed, so this can't reveal who has an account.
    if (!CODE_ERRORS.has(name)) console.error("[auth] confirm failed", name);
    return NextResponse.json({ error: "That code didn't work. Check the latest email from us and try again." }, { status: 400 });
  }
}

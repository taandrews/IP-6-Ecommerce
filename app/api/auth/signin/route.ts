import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/lib/aws/cognito";
import { setSessionCookies } from "@/lib/auth/session";
import jwt from "jsonwebtoken";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await signIn(parsed.data.email, parsed.data.password);
    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    const decoded = jwt.decode(idToken) as Record<string, unknown> | null;
    setSessionCookies(idToken, {
      sub: String(decoded?.sub ?? ""),
      email: String(decoded?.email ?? parsed.data.email),
      name: typeof decoded?.name === "string" ? decoded.name : undefined,
      groups: Array.isArray(decoded?.["cognito:groups"])
        ? (decoded["cognito:groups"] as string[])
        : [],
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? "Sign in failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

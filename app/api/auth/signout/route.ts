import { NextResponse } from "next/server";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";
import { globalSignOut } from "@/lib/aws/cognito";

export const runtime = "nodejs";

/** Signs out here and revokes the refresh token so other devices sign out too. */
export async function POST(req: Request) {
  const access = getAccessToken();
  if (access) await globalSignOut(access).catch(() => undefined);
  clearAuthCookies();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}

import { NextResponse } from "next/server";
import { clearAuthCookies, getAccessToken, getStaffUser } from "@/lib/auth/session";
import { globalSignOut } from "@/lib/aws/cognito";
import { audit } from "@/lib/data/audit";
import { roleFromGroups } from "@/lib/auth/roles";

export const runtime = "nodejs";

/** Ends the staff session here and revokes it on every device. */
export async function POST(req: Request) {
  const user = await getStaffUser();
  const access = getAccessToken("staff");
  if (access) await globalSignOut(access).catch(() => undefined);
  if (user) await audit({ sub: user.sub, email: user.email, role: roleFromGroups(user.groups) ?? "none" }, "staff.signout");
  clearAuthCookies("staff");
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}

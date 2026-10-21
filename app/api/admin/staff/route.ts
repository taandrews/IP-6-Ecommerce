import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { inviteStaff } from "@/lib/aws/cognito";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(80),
  role: z.enum(["owner", "staff", "viewer"]),
});

/**
 * Owner-only invite. Creates a login in the STAFF user pool (never the
 * customer pool); Cognito emails a temporary password and the person must
 * set a new password and an authenticator app on first sign-in.
 */
export const POST = withAdmin("staff:manage", async (req, staff) => {
  const b = await parseBody(req, Body);
  try {
    const username = await inviteStaff(b.email, b.name, b.role);
    await audit(staff.actor, "staff.invite", username, { role: b.role }, staff.ip);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).name === "UsernameExistsException") throw new HttpError(409, "already_staff");
    throw err;
  }
});

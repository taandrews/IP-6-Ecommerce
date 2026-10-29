import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccessToken, getStaffUser, type SessionUser } from "@/lib/auth/session";
import { accessTokenActive } from "@/lib/aws/cognito";
import { can, roleFromGroups, type Permission, type Role } from "@/lib/auth/roles";
import type { AuditActor } from "@/lib/data/audit";
import { clientIpFrom } from "@/lib/client-ip";
import { loadLinkKey } from "@/lib/admin/seal";

export interface StaffContext {
  user: SessionUser;
  role: Role;
  actor: AuditActor;
  ip: string;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

function clientIp() {
  return clientIpFrom(headers(), "");
}

// Access tokens Cognito confirmed recently, so a page with many requests asks once.
const confirmed = new Map<string, number>();
const CONFIRM_TTL_MS = 30_000;

/** Asks Cognito whether the session was revoked (removed, disabled or re-roled staff). */
async function sessionLive(): Promise<boolean> {
  const token = getAccessToken("staff");
  if (!token) return false;
  const now = Date.now();
  const at = confirmed.get(token);
  if (at && now - at < CONFIRM_TTL_MS) return true;
  if (!(await accessTokenActive(token))) {
    confirmed.delete(token);
    return false;
  }
  if (confirmed.size > 500) for (const [k, v] of confirmed) if (now - v >= CONFIRM_TTL_MS) confirmed.delete(k);
  confirmed.set(token, now);
  return true;
}

/**
 * The signed-in staff member. Only a token signed by the separate STAFF user
 * pool is accepted (signature, issuer, audience and expiry are verified), and
 * that pool requires MFA at every sign-in, so a valid token means the person
 * passed their authenticator code. Cognito is also asked whether the session
 * is still live, so removing or re-roling someone takes effect at once.
 */
export async function getStaff(): Promise<StaffContext | null> {
  const user = await getStaffUser();
  if (!user) return null;
  if (!(await sessionLive())) return null;
  const role = roleFromGroups(user.groups);
  if (!role) return null;
  await loadLinkKey();
  return { user, role, actor: { sub: user.sub, email: user.email, role }, ip: clientIp() };
}

/** For admin pages (server components). */
export async function requireStaffPage(permission?: Permission) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (permission && !can(staff.role, permission)) redirect("/admin?denied=1");
  return staff;
}

type Handler<P> = (req: Request, ctx: StaffContext, params: P) => Promise<Response>;

/**
 * Wraps an admin API route: requires a verified staff session with the given
 * permission, and turns thrown errors into safe JSON responses (no stack
 * traces or internal messages reach the browser).
 */
export function withAdmin<P = Record<string, string>>(permission: Permission, handler: Handler<P>) {
  return async (req: Request, route: { params: P }) => {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    if (!can(staff.role, permission)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    try {
      const res = await handler(req, staff, route?.params ?? ({} as P));
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.code }, { status: err.status });
      console.error("[admin] handler failed", permission, (err as Error).name);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}

/** Parses a JSON body with a zod schema, or throws a 400. */
export async function parseBody<T>(req: Request, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, "invalid_request");
  return parsed.data;
}

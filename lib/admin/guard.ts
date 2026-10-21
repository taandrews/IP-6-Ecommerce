import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStaffUser, type SessionUser } from "@/lib/auth/session";
import { can, roleFromGroups, type Permission, type Role } from "@/lib/auth/roles";
import type { AuditActor } from "@/lib/data/audit";

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
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
}

/**
 * The signed-in staff member. Only a token signed by the separate STAFF user
 * pool is accepted (signature, issuer, audience and expiry are verified), and
 * that pool requires MFA at every sign-in, so a valid token means the person
 * passed their authenticator code.
 */
export async function getStaff(): Promise<StaffContext | null> {
  const user = await getStaffUser();
  if (!user) return null;
  const role = roleFromGroups(user.groups);
  if (!role) return null;
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

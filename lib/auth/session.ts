import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface SessionUser {
  sub: string;
  email: string;
  name?: string;
  groups?: string[];
}

const SESSION_COOKIE = "ip6_session";
const ADMIN_COOKIE = "ip6_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setSessionCookies(idToken: string, user: SessionUser) {
  const c = cookies();
  c.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  const adminGroup = process.env.COGNITO_ADMIN_GROUP ?? "admin";
  if (user.groups?.includes(adminGroup)) {
    c.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }
}

export function clearSessionCookies() {
  const c = cookies();
  c.delete(SESSION_COOKIE);
  c.delete(ADMIN_COOKIE);
}

export function getSessionUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    if (!decoded || typeof decoded.sub !== "string") return null;
    return {
      sub: decoded.sub,
      email: String(decoded.email ?? ""),
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      groups: Array.isArray(decoded["cognito:groups"])
        ? (decoded["cognito:groups"] as string[])
        : undefined,
    };
  } catch {
    return null;
  }
}

export function requireAdmin(): SessionUser | null {
  const user = getSessionUser();
  const adminGroup = process.env.COGNITO_ADMIN_GROUP ?? "admin";
  if (!user || !user.groups?.includes(adminGroup)) return null;
  return user;
}

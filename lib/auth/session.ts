import "server-only";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";
import { AUTH_COOKIES, CHALLENGE_MAX_AGE, REFRESH_MAX_AGE, sameSiteFor, secureCookies, type Realm } from "./config";
import { verifyIdToken, type VerifiedUser } from "./jwt";

export type SessionUser = VerifiedUser;

interface TokenSet {
  IdToken?: string;
  AccessToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
}

function cookieOpts(realm: Realm, maxAge: number) {
  return { httpOnly: true, secure: secureCookies(), sameSite: sameSiteFor(realm), path: "/", maxAge };
}

/**
 * Stores Cognito tokens in httpOnly cookies for one realm. The ID and access
 * tokens live exactly as long as the tokens; the refresh token decides how
 * long the person stays signed in (12 hours for staff, 30 days for customers).
 */
export async function setAuthCookies(tokens: TokenSet, realm: Realm = "customer") {
  if (!tokens.IdToken || !tokens.AccessToken) throw new Error("incomplete token set");
  const user = await verifyIdToken(tokens.IdToken, realm);
  if (!user) throw new Error("token verification failed");
  const names = AUTH_COOKIES[realm];
  const c = await cookies();
  const ttl = Math.max(60, Math.min(tokens.ExpiresIn ?? 3600, 3600));
  c.set(names.id, tokens.IdToken, cookieOpts(realm, ttl));
  c.set(names.access, tokens.AccessToken, cookieOpts(realm, ttl));
  if (tokens.RefreshToken) c.set(names.refresh, tokens.RefreshToken, cookieOpts(realm, REFRESH_MAX_AGE[realm]));
  c.delete(names.challenge);
  return user;
}

export function clearAuthCookies(realm: Realm = "customer") {
  const c = (cookies() as unknown as UnsafeUnwrappedCookies);
  for (const name of Object.values(AUTH_COOKIES[realm])) c.delete(name);
  // Cookie from the previous, unverified admin check. Removed wherever it lingers.
  c.delete("ip6_admin");
}

export interface PendingChallenge {
  name: string;
  session: string;
  username: string;
  email: string;
  next: string;
}

export function setChallengeCookie(ch: PendingChallenge, realm: Realm = "customer") {
  (cookies() as unknown as UnsafeUnwrappedCookies).set(AUTH_COOKIES[realm].challenge, JSON.stringify(ch), cookieOpts(realm, CHALLENGE_MAX_AGE));
}

export function readChallengeCookie(realm: Realm = "customer"): PendingChallenge | null {
  const raw = (cookies() as unknown as UnsafeUnwrappedCookies).get(AUTH_COOKIES[realm].challenge)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as PendingChallenge;
    return typeof v.session === "string" && typeof v.username === "string" ? v : null;
  } catch {
    return null;
  }
}

/** The signed-in customer, or null. The token signature is always verified. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIES.customer.id)?.value;
  if (!token) return null;
  return verifyIdToken(token, "customer");
}

/** The signed-in staff member's verified token claims, or null. */
export async function getStaffUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIES.staff.id)?.value;
  if (!token) return null;
  return verifyIdToken(token, "staff");
}

export function getAccessToken(realm: Realm = "customer"): string | null {
  return (cookies() as unknown as UnsafeUnwrappedCookies).get(AUTH_COOKIES[realm].access)?.value ?? null;
}

export { safeNextPath } from "./redirect";

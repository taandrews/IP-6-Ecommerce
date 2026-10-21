/**
 * Cognito token verification. Runs in both the Node runtime and the Edge
 * middleware (jose uses Web Crypto). A token is accepted only when its
 * signature matches the pool's published keys, the issuer and audience
 * match this app, the token type is right, and it has not expired.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { cognitoConfig, type Realm } from "./config";

export interface VerifiedUser {
  sub: string;
  /** Cognito's internal username; needed for admin API calls and refresh. */
  username: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  groups: string[];
  /** Token expiry, seconds since epoch. */
  exp: number;
}

const remoteKeys = new Map<string, JWTVerifyGetKey>();

function keySet(realm: Realm): JWTVerifyGetKey {
  const { jwksUrl } = cognitoConfig(realm);
  let keys = remoteKeys.get(jwksUrl);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(jwksUrl), { cooldownDuration: 30_000 });
    remoteKeys.set(jwksUrl, keys);
  }
  return keys;
}

/**
 * Verifies an ID token for one realm. The issuer is that realm's pool, so a
 * token from the other pool always fails.
 */
export async function verifyIdToken(token: string, realm: Realm = "customer", keys?: JWTVerifyGetKey): Promise<VerifiedUser | null> {
  const { issuer, clientId } = cognitoConfig(realm);
  keys ??= keySet(realm);
  if (!token || !clientId) return null;
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer,
      audience: clientId,
      algorithms: ["RS256"],
      clockTolerance: 5,
    });
    if (payload.token_use !== "id") return null;
    return toUser(payload);
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string, realm: Realm = "customer", keys?: JWTVerifyGetKey): Promise<JWTPayload | null> {
  const { issuer, clientId } = cognitoConfig(realm);
  keys ??= keySet(realm);
  if (!token || !clientId) return null;
  try {
    const { payload } = await jwtVerify(token, keys, { issuer, algorithms: ["RS256"], clockTolerance: 5 });
    // Cognito access tokens carry the app client in client_id, not aud.
    if (payload.token_use !== "access" || payload.client_id !== clientId) return null;
    return payload;
  } catch {
    return null;
  }
}

function toUser(p: JWTPayload): VerifiedUser | null {
  if (typeof p.sub !== "string" || typeof p.exp !== "number") return null;
  const groups = Array.isArray(p["cognito:groups"]) ? (p["cognito:groups"] as unknown[]).filter((g): g is string => typeof g === "string") : [];
  return {
    sub: p.sub,
    username: typeof p["cognito:username"] === "string" ? (p["cognito:username"] as string) : p.sub,
    email: typeof p.email === "string" ? p.email : "",
    emailVerified: p.email_verified === true || p.email_verified === "true",
    name: typeof p.name === "string" ? p.name : undefined,
    groups,
    exp: p.exp,
  };
}

/**
 * Reads claims WITHOUT verifying. Only for picking the username to send
 * with a refresh request, which Cognito itself then authenticates.
 * Never use the result for an access decision.
 */
export function unverifiedUsername(token: string | undefined): string | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json["cognito:username"] === "string" ? json["cognito:username"] : typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

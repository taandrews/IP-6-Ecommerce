import { awsRegion } from "@/lib/aws/region";

/**
 * Cognito settings shared by the Node routes and the Edge middleware.
 * Nothing here imports Node built-ins, so the middleware can use it.
 *
 * Customers and staff live in two separate Cognito user pools ("realms").
 * A token is only ever checked against the issuer of the realm it is
 * presented for, so a customer token can never open the admin portal, and
 * the staff pool enforces MFA and has no public sign-up.
 *
 * COGNITO_ISSUER / STAFF_COGNITO_ISSUER and COGNITO_ENDPOINT exist only so a
 * local Cognito emulator can stand in during testing; in production they are
 * derived from the region and pool ids.
 */

export type Realm = "customer" | "staff";

export const AUTH_COOKIES = {
  customer: {
    id: "ip6_session",
    access: "ip6_access",
    refresh: "ip6_refresh",
    challenge: "ip6_challenge",
  },
  staff: {
    id: "ip6_staff_session",
    access: "ip6_staff_access",
    refresh: "ip6_staff_refresh",
    challenge: "ip6_staff_challenge",
  },
} as const;

/** Customers stay signed in for 30 days; staff sessions end after 12 hours. */
export const REFRESH_MAX_AGE: Record<Realm, number> = {
  customer: 60 * 60 * 24 * 30,
  staff: 60 * 60 * 12,
};
/** A sign-in challenge (new password, MFA) must be answered within 5 minutes. */
export const CHALLENGE_MAX_AGE = 60 * 5;

export function cognitoConfig(realm: Realm = "customer") {
  const region = awsRegion();
  const userPoolId = (realm === "staff" ? process.env.STAFF_COGNITO_USER_POOL_ID : process.env.COGNITO_USER_POOL_ID) ?? "";
  const clientId = (realm === "staff" ? process.env.STAFF_COGNITO_CLIENT_ID : process.env.COGNITO_CLIENT_ID) ?? "";
  const clientSecret = (realm === "staff" ? process.env.STAFF_COGNITO_CLIENT_SECRET : process.env.COGNITO_CLIENT_SECRET) ?? "";
  const issuerOverride = realm === "staff" ? process.env.STAFF_COGNITO_ISSUER : process.env.COGNITO_ISSUER;
  const issuer = issuerOverride?.replace(/\/$/, "") ?? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const endpoint = process.env.COGNITO_ENDPOINT?.replace(/\/$/, "") ?? `https://cognito-idp.${region}.amazonaws.com`;
  // Test-only override for a local emulator's signing keys; ignored in production.
  const jwksOverride =
    process.env.NODE_ENV !== "production" ? (realm === "staff" ? process.env.STAFF_COGNITO_JWKS_URL : process.env.COGNITO_JWKS_URL) : undefined;
  return { realm, region, userPoolId, clientId, clientSecret, issuer, endpoint, jwksUrl: jwksOverride ?? `${issuer}/.well-known/jwks.json` };
}

export function isAuthConfigured(realm: Realm = "customer") {
  const c = cognitoConfig(realm);
  return Boolean(c.userPoolId && c.clientId);
}

/** Cookies are Secure everywhere except plain-http local development. */
export function secureCookies() {
  return process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "true";
}

/** Staff cookies are SameSite=Strict: never sent on a request started from another site. */
export function sameSiteFor(realm: Realm) {
  return realm === "staff" ? ("strict" as const) : ("lax" as const);
}

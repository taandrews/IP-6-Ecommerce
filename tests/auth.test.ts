import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet, type JWK, type KeyLike } from "jose";
import { verifyIdToken, verifyAccessToken } from "@/lib/auth/jwt";
import { roleFromGroups, can, PERMISSIONS } from "@/lib/auth/roles";
import { safeNextPath } from "@/lib/auth/redirect";

const CUSTOMER_POOL = "us-east-1_CUSTOMER";
const STAFF_POOL = "us-east-1_STAFF";
const iss = (pool: string) => `https://cognito-idp.us-east-1.amazonaws.com/${pool}`;

let privateKey: KeyLike;
let otherKey: KeyLike;
let keys: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  process.env.AWS_REGION = "us-east-1";
  process.env.COGNITO_USER_POOL_ID = CUSTOMER_POOL;
  process.env.COGNITO_CLIENT_ID = "customer-client";
  process.env.STAFF_COGNITO_USER_POOL_ID = STAFF_POOL;
  process.env.STAFF_COGNITO_CLIENT_ID = "staff-client";
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  otherKey = (await generateKeyPair("RS256")).privateKey;
  const jwk = (await exportJWK(pair.publicKey)) as JWK;
  keys = createLocalJWKSet({ keys: [{ ...jwk, kid: "k1", alg: "RS256", use: "sig" }] });
});

async function token(claims: Record<string, unknown>, opts: { pool?: string; key?: KeyLike; exp?: string } = {}) {
  return new SignJWT({ token_use: "id", email: "a@b.com", email_verified: true, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(iss(opts.pool ?? CUSTOMER_POOL))
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "1h")
    .sign(opts.key ?? privateKey);
}

describe("verifyIdToken", () => {
  it("accepts a correctly signed customer token", async () => {
    const t = await token({ aud: "customer-client" });
    const u = await verifyIdToken(t, "customer", keys);
    expect(u?.sub).toBe("user-1");
    expect(u?.emailVerified).toBe(true);
  });

  it("rejects a customer token presented to the staff realm (separate pools)", async () => {
    const t = await token({ aud: "customer-client", "cognito:groups": ["owner"] });
    expect(await verifyIdToken(t, "staff", keys)).toBeNull();
  });

  it("accepts a staff token only in the staff realm", async () => {
    const t = await token({ aud: "staff-client", "cognito:groups": ["staff"] }, { pool: STAFF_POOL });
    expect((await verifyIdToken(t, "staff", keys))?.groups).toEqual(["staff"]);
    expect(await verifyIdToken(t, "customer", keys)).toBeNull();
  });

  it("rejects a token signed with a different key (forged)", async () => {
    const t = await token({ aud: "customer-client" }, { key: otherKey });
    expect(await verifyIdToken(t, "customer", keys)).toBeNull();
  });

  it("rejects an unsigned token claiming admin groups", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({ sub: "x", iss: iss(STAFF_POOL), aud: "staff-client", token_use: "id", "cognito:groups": ["owner"], exp: 9999999999 }),
    ).toString("base64url");
    expect(await verifyIdToken(`${header}.${body}.`, "staff", keys)).toBeNull();
  });

  it("rejects the wrong audience, an expired token and an access token used as an ID token", async () => {
    expect(await verifyIdToken(await token({ aud: "someone-else" }), "customer", keys)).toBeNull();
    expect(await verifyIdToken(await token({ aud: "customer-client" }, { exp: "-10m" }), "customer", keys)).toBeNull();
    expect(await verifyIdToken(await token({ aud: "customer-client", token_use: "access" }), "customer", keys)).toBeNull();
  });

  it("verifies access tokens by client_id", async () => {
    const t = await token({ token_use: "access", client_id: "customer-client" });
    expect(await verifyAccessToken(t, "customer", keys)).not.toBeNull();
    const wrong = await token({ token_use: "access", client_id: "staff-client" });
    expect(await verifyAccessToken(wrong, "customer", keys)).toBeNull();
  });
});

describe("roles", () => {
  it("maps staff-pool groups to roles; anything else is no role", () => {
    expect(roleFromGroups(["owner"])).toBe("owner");
    expect(roleFromGroups(["viewer", "staff"])).toBe("staff");
    expect(roleFromGroups(["admin"])).toBeNull();
    expect(roleFromGroups([])).toBeNull();
    expect(roleFromGroups(undefined)).toBeNull();
  });

  it("keeps sensitive permissions owner-only", () => {
    for (const p of ["orders:refund", "orders:export", "customers:export", "customers:delete", "staff:manage", "audit:read", "products:write"] as const) {
      expect(PERMISSIONS[p]).toEqual(["owner"]);
    }
    expect(can("viewer", "customers:pii")).toBe(false);
    expect(can("staff", "customers:pii")).toBe(true);
    expect(can("viewer", "orders:read")).toBe(true);
    expect(can(null, "orders:read")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-site paths only", () => {
    expect(safeNextPath("/account/orders")).toBe("/account/orders");
    expect(safeNextPath("//evil.example")).toBe("/account");
    expect(safeNextPath("https://evil.example")).toBe("/account");
    expect(safeNextPath("/\\evil.example")).toBe("/account");
    expect(safeNextPath("/a\r\nSet-Cookie:x")).toBe("/account");
    expect(safeNextPath(undefined, "/admin")).toBe("/admin");
  });
});

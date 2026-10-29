import "server-only";
import { awsRegion } from "./region";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminUserGlobalSignOutCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type AttributeType,
  type ChallengeNameType,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "node:crypto";
import { cognitoConfig, cognitoEndpoint, type Realm } from "@/lib/auth/config";
import { ROLE_GROUPS, type Role } from "@/lib/auth/roles";

/**
 * Two separate user pools: customers (self sign-up) and staff (admin-created
 * only, MFA required by the pool). Every function names the pool it uses.
 */
export const cognitoClient = new CognitoIdentityProviderClient({
  region: awsRegion(),
  ...(cognitoEndpoint() ? { endpoint: cognitoEndpoint() } : {}),
});

function secretHash(realm: Realm, username: string) {
  const { clientId, clientSecret } = cognitoConfig(realm);
  if (!clientSecret) return undefined;
  return crypto.createHmac("sha256", clientSecret).update(username + clientId).digest("base64");
}

function withSecret<T extends Record<string, string>>(realm: Realm, username: string, params: T): T {
  const h = secretHash(realm, username);
  return h ? { ...params, SECRET_HASH: h } : params;
}

// ---------------------------------------------------------------------------
// Sign-in (both pools)
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string, realm: Realm) {
  return cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoConfig(realm).clientId,
      AuthParameters: withSecret(realm, email, { USERNAME: email, PASSWORD: password }),
    }),
  );
}

export async function respondToChallenge(
  realm: Realm,
  name: ChallengeNameType | string,
  session: string,
  username: string,
  responses: Record<string, string>,
) {
  return cognitoClient.send(
    new RespondToAuthChallengeCommand({
      ClientId: cognitoConfig(realm).clientId,
      ChallengeName: name as ChallengeNameType,
      Session: session,
      ChallengeResponses: withSecret(realm, username, { USERNAME: username, ...responses }),
    }),
  );
}

/** First step of authenticator-app enrolment during the staff MFA_SETUP challenge. */
export async function startTotpEnrolment(session: string) {
  const res = await cognitoClient.send(new AssociateSoftwareTokenCommand({ Session: session }));
  if (!res.SecretCode || !res.Session) throw new Error("no secret returned");
  return { secret: res.SecretCode, session: res.Session };
}

/** Confirms the first code from the authenticator app; returns the session to finish sign-in. */
export async function confirmTotpEnrolment(session: string, code: string) {
  const res = await cognitoClient.send(
    new VerifySoftwareTokenCommand({ Session: session, UserCode: code, FriendlyDeviceName: "Authenticator" }),
  );
  if (res.Status !== "SUCCESS" || !res.Session) return null;
  return res.Session;
}

/**
 * True while Cognito still honours this access token. Signing a staff member
 * out everywhere, disabling them or changing their role revokes it at once,
 * even though the ID token itself would still verify until it expires.
 */
export async function accessTokenActive(accessToken: string): Promise<boolean> {
  try {
    await cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
    return true;
  } catch (err) {
    if ((err as Error).name !== "NotAuthorizedException" && (err as Error).name !== "UserNotFoundException") {
      console.error("[auth] access token check failed", (err as Error).name);
    }
    return false;
  }
}

/** Revokes every refresh token for the signed-in user (either pool). */
export async function globalSignOut(accessToken: string) {
  return cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
}

export async function forgotPassword(email: string, realm: Realm = "customer") {
  const h = secretHash(realm, email);
  return cognitoClient.send(
    new ForgotPasswordCommand({ ClientId: cognitoConfig(realm).clientId, Username: email, ...(h ? { SecretHash: h } : {}) }),
  );
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string, realm: Realm = "customer") {
  const h = secretHash(realm, email);
  return cognitoClient.send(
    new ConfirmForgotPasswordCommand({
      ClientId: cognitoConfig(realm).clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
      ...(h ? { SecretHash: h } : {}),
    }),
  );
}

// ---------------------------------------------------------------------------
// Customer self-service (customer pool only)
// ---------------------------------------------------------------------------

export async function signUp(email: string, password: string, name: string) {
  const h = secretHash("customer", email);
  return cognitoClient.send(
    new SignUpCommand({
      ClientId: cognitoConfig("customer").clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
      ...(h ? { SecretHash: h } : {}),
    }),
  );
}

export async function confirmSignUp(email: string, code: string) {
  const h = secretHash("customer", email);
  return cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: cognitoConfig("customer").clientId,
      Username: email,
      ConfirmationCode: code,
      ...(h ? { SecretHash: h } : {}),
    }),
  );
}

// ---------------------------------------------------------------------------
// Staff management (staff pool only; owner permission enforced by the route)
// ---------------------------------------------------------------------------

export interface StaffMember {
  username: string;
  email: string;
  name?: string;
  role: Role | null;
  status?: string;
  enabled: boolean;
  createdAt?: string;
}

function attr(attrs: AttributeType[] | undefined, name: string) {
  return attrs?.find((a) => a.Name === name)?.Value;
}

const staffPool = () => cognitoConfig("staff").userPoolId;
const customerPool = () => cognitoConfig("customer").userPoolId;

export async function listStaff(): Promise<StaffMember[]> {
  const roleOf = new Map<string, Role>();
  for (const role of ["viewer", "staff", "owner"] as Role[]) {
    let next: string | undefined;
    do {
      const res = await cognitoClient
        .send(new ListUsersInGroupCommand({ UserPoolId: staffPool(), GroupName: ROLE_GROUPS[role], NextToken: next, Limit: 60 }))
        .catch((e: { name?: string }) => {
          if (e?.name === "ResourceNotFoundException") return { Users: [], NextToken: undefined };
          throw e;
        });
      for (const u of res.Users ?? []) if (u.Username) roleOf.set(u.Username, role); // later (higher) roles win
      next = res.NextToken;
    } while (next);
  }
  const out: StaffMember[] = [];
  let token: string | undefined;
  do {
    const res = await cognitoClient.send(new ListUsersCommand({ UserPoolId: staffPool(), PaginationToken: token, Limit: 60 }));
    for (const u of res.Users ?? []) {
      if (!u.Username) continue;
      out.push({
        username: u.Username,
        email: attr(u.Attributes, "email") ?? "",
        name: attr(u.Attributes, "name"),
        role: roleOf.get(u.Username) ?? null,
        status: u.UserStatus,
        enabled: u.Enabled !== false,
        createdAt: u.UserCreateDate?.toISOString(),
      });
    }
    token = res.PaginationToken;
  } while (token);
  return out.sort((a, b) => a.email.localeCompare(b.email));
}

/** Creates a staff login; Cognito emails a temporary password valid for 24 hours. */
export async function inviteStaff(email: string, name: string, role: Role) {
  const res = await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: staffPool(),
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: name },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    }),
  );
  const username = res.User?.Username;
  if (!username) throw new Error("user not created");
  await setStaffRole(username, role);
  return username;
}

async function groupsFor(username: string) {
  const res = await cognitoClient.send(new AdminListGroupsForUserCommand({ UserPoolId: staffPool(), Username: username }));
  return (res.Groups ?? []).map((g) => g.GroupName ?? "").filter(Boolean);
}

export async function setStaffRole(username: string, role: Role) {
  const target = ROLE_GROUPS[role];
  const roleGroups = new Set<string>(Object.values(ROLE_GROUPS));
  const current = await groupsFor(username);
  for (const g of current) {
    if (roleGroups.has(g) && g !== target) {
      await cognitoClient.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: staffPool(), Username: username, GroupName: g }));
    }
  }
  if (!current.includes(target)) {
    await cognitoClient.send(new AdminAddUserToGroupCommand({ UserPoolId: staffPool(), Username: username, GroupName: target }));
  }
  await signOutStaffEverywhere(username);
}

/** Revokes access immediately: disables the login and ends every session. */
export async function disableStaff(username: string) {
  await cognitoClient.send(new AdminDisableUserCommand({ UserPoolId: staffPool(), Username: username }));
  await signOutStaffEverywhere(username);
}

export async function enableStaff(username: string) {
  await cognitoClient.send(new AdminEnableUserCommand({ UserPoolId: staffPool(), Username: username }));
}

export async function deleteStaff(username: string) {
  await signOutStaffEverywhere(username).catch(() => undefined);
  await cognitoClient.send(new AdminDeleteUserCommand({ UserPoolId: staffPool(), Username: username }));
}

/** Revokes every token the person holds; the admin guard checks this on each request. */
export async function signOutStaffEverywhere(username: string) {
  await cognitoClient.send(new AdminUserGlobalSignOutCommand({ UserPoolId: staffPool(), Username: username }));
}

// ---------------------------------------------------------------------------
// Customer accounts, read and erased from the admin portal (customer pool)
// ---------------------------------------------------------------------------

export interface CustomerAccount {
  username: string;
  sub: string;
  email: string;
  name?: string;
  status?: string;
  enabled: boolean;
  createdAt?: string;
}

function toAccount(u: UserType): CustomerAccount {
  return {
    username: u.Username ?? "",
    sub: attr(u.Attributes, "sub") ?? u.Username ?? "",
    email: attr(u.Attributes, "email") ?? "",
    name: attr(u.Attributes, "name"),
    status: u.UserStatus,
    enabled: u.Enabled !== false,
    createdAt: u.UserCreateDate?.toISOString(),
  };
}

/** Cognito filter values cannot contain quotes or backslashes. */
function filterValue(v: string) {
  return v.replace(/["\\]/g, "").slice(0, 254);
}

export async function listAccounts(opts: { emailPrefix?: string; cursor?: string; limit?: number }) {
  const res = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: customerPool(),
      Limit: Math.min(Math.max(opts.limit ?? 25, 1), 60),
      PaginationToken: opts.cursor,
      ...(opts.emailPrefix ? { Filter: `email ^= "${filterValue(opts.emailPrefix)}"` } : {}),
    }),
  );
  return { accounts: (res.Users ?? []).map(toAccount), cursor: res.PaginationToken };
}

export async function findAccountByEmail(email: string): Promise<CustomerAccount | null> {
  const res = await cognitoClient.send(
    new ListUsersCommand({ UserPoolId: customerPool(), Limit: 1, Filter: `email = "${filterValue(email)}"` }),
  );
  const u = res.Users?.[0];
  return u ? toAccount(u) : null;
}

export async function deleteCustomerAccount(username: string) {
  await cognitoClient
    .send(new AdminUserGlobalSignOutCommand({ UserPoolId: customerPool(), Username: username }))
    .catch(() => undefined);
  await cognitoClient.send(new AdminDeleteUserCommand({ UserPoolId: customerPool(), Username: username }));
}

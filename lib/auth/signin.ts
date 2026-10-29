import "server-only";
import type { InitiateAuthCommandOutput, RespondToAuthChallengeCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import { setAuthCookies, setChallengeCookie } from "./session";
import { verifyIdToken } from "./jwt";
import { roleFromGroups } from "./roles";
import type { Realm } from "./config";

export type ChallengeKind = "NEW_PASSWORD" | "MFA" | "MFA_SETUP";

export type SignInOutcome =
  | { status: "ok"; next: string }
  | { status: "challenge"; challenge: ChallengeKind }
  | { status: "error"; error: string; httpStatus: number };

const CHALLENGES: Record<string, ChallengeKind> = {
  NEW_PASSWORD_REQUIRED: "NEW_PASSWORD",
  SOFTWARE_TOKEN_MFA: "MFA",
  MFA_SETUP: "MFA_SETUP",
};

export function challengeKind(name: string | undefined): ChallengeKind | null {
  return (name && CHALLENGES[name]) || null;
}

/** Turns a Cognito auth response into session cookies or the next challenge step. */
export async function completeAuth(
  realm: Realm,
  res: InitiateAuthCommandOutput | RespondToAuthChallengeCommandOutput,
  ctx: { username: string; email: string; next: string },
): Promise<SignInOutcome> {
  if (res.AuthenticationResult?.IdToken) {
    if (realm === "staff") {
      // A staff login with no role assigned (or a removed role) gets nothing, not even a session cookie.
      const claims = await verifyIdToken(res.AuthenticationResult.IdToken, realm);
      if (!claims || !roleFromGroups(claims.groups)) {
        return { status: "error", error: "Your account has no admin role. Ask an owner to assign one.", httpStatus: 403 };
      }
    }
    await setAuthCookies(res.AuthenticationResult, realm);
    return { status: "ok", next: ctx.next };
  }
  const kind = challengeKind(res.ChallengeName);
  // Customers only ever see the new-password step; staff pools also require MFA.
  if (kind && res.Session && (realm === "staff" || kind === "NEW_PASSWORD")) {
    setChallengeCookie(
      {
        name: res.ChallengeName!,
        session: res.Session,
        username: res.ChallengeParameters?.USER_ID_FOR_SRP ?? ctx.username,
        email: ctx.email,
        next: ctx.next,
      },
      realm,
    );
    return { status: "challenge", challenge: kind };
  }
  return { status: "error", error: "This sign-in step isn't supported. Contact support.", httpStatus: 400 };
}

/** Maps Cognito errors to messages that never reveal whether an account exists. */
export function authErrorMessage(err: unknown): { error: string; httpStatus: number } {
  const name = (err as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return { error: "Email or password is incorrect.", httpStatus: 401 };
    case "UserNotConfirmedException":
      return { error: "Please confirm your email first. Check your inbox for the code.", httpStatus: 403 };
    case "PasswordResetRequiredException":
      return { error: "Please reset your password to continue.", httpStatus: 403 };
    case "CodeMismatchException":
    case "EnableSoftwareTokenMFAException":
      return { error: "That code is incorrect. Use the latest code from your authenticator app.", httpStatus: 401 };
    case "ExpiredCodeException":
      return { error: "That code has expired. Please sign in again.", httpStatus: 401 };
    case "InvalidPasswordException":
      return { error: "That password doesn't meet the requirements shown.", httpStatus: 400 };
    case "TooManyRequestsException":
    case "LimitExceededException":
      return { error: "Too many attempts. Please wait a few minutes and try again.", httpStatus: 429 };
    default:
      return { error: "Sign in failed. Please try again.", httpStatus: 500 };
  }
}

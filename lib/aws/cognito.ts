import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "node:crypto";

const region = process.env.AWS_REGION ?? "us-east-1";

export const cognitoClient = new CognitoIdentityProviderClient({
  region,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? "";
const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET ?? "";
const ADMIN_GROUP = process.env.COGNITO_ADMIN_GROUP ?? "admin";

function secretHash(username: string) {
  if (!CLIENT_SECRET) return undefined;
  return crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest("base64");
}

export async function signIn(email: string, password: string) {
  const cmd = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      ...(secretHash(email) ? { SECRET_HASH: secretHash(email)! } : {}),
    },
  });
  return cognitoClient.send(cmd);
}

export async function signUp(email: string, password: string, name: string) {
  const cmd = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
    ...(secretHash(email) ? { SecretHash: secretHash(email) } : {}),
  });
  return cognitoClient.send(cmd);
}

export async function confirmSignUp(email: string, code: string) {
  const cmd = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    ...(secretHash(email) ? { SecretHash: secretHash(email) } : {}),
  });
  return cognitoClient.send(cmd);
}

export async function forgotPassword(email: string) {
  const cmd = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ...(secretHash(email) ? { SecretHash: secretHash(email) } : {}),
  });
  return cognitoClient.send(cmd);
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string) {
  const cmd = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
    ...(secretHash(email) ? { SecretHash: secretHash(email) } : {}),
  });
  return cognitoClient.send(cmd);
}

export async function addUserToAdminGroup(email: string) {
  const cmd = new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    GroupName: ADMIN_GROUP,
  });
  return cognitoClient.send(cmd);
}

export async function getUser(accessToken: string) {
  return cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
}

export async function signOut(accessToken: string) {
  return cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
}

export async function getAdminUser(username: string) {
  return cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: username }),
  );
}

export const COGNITO_ADMIN_GROUP = ADMIN_GROUP;

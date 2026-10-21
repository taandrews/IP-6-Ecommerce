/**
 * Creates the first admin owner in the STAFF user pool. Run once after the
 * stack is deployed (later staff are invited from Admin, Staff):
 *
 *   STAFF_COGNITO_USER_POOL_ID=us-east-1_xxx AWS_PROFILE=<ip6 profile> \
 *     npx tsx scripts/create-owner.ts owner@example.com "Full Name"
 *
 * Cognito emails a temporary password. On first sign-in at /admin/login the
 * owner sets a new password and enrols an authenticator app.
 */
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

async function main() {
  const [email, name] = process.argv.slice(2);
  const pool = process.env.STAFF_COGNITO_USER_POOL_ID;
  if (!pool || !email || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: STAFF_COGNITO_USER_POOL_ID=... npx tsx scripts/create-owner.ts <email> "<name>"');
    process.exit(1);
  }
  const client = new CognitoIdentityProviderClient({ region: process.env.APP_AWS_REGION ?? process.env.AWS_REGION ?? "us-east-1" });
  const res = await client.send(
    new AdminCreateUserCommand({
      UserPoolId: pool,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: name },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    }),
  );
  await client.send(new AdminAddUserToGroupCommand({ UserPoolId: pool, Username: res.User!.Username!, GroupName: "owner" }));
  console.log(`Owner created for ${email}. A temporary password was emailed.`);
}

main().catch((err) => {
  console.error("Failed:", (err as Error).name, (err as Error).message);
  process.exit(1);
});

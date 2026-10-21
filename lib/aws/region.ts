/**
 * Region of the data plane (DynamoDB, Cognito, SES, Secrets Manager, S3).
 *
 * The stacks live in us-east-1 while Amplify Hosting runs the app in us-east-2
 * and sets AWS_REGION to its own region at runtime (it also refuses any
 * environment variable that starts with "AWS"), so the app takes its region
 * from APP_AWS_REGION first. Read at call time so tests and scripts can set it.
 */
export function awsRegion(): string {
  return process.env.APP_AWS_REGION || process.env.AWS_REGION || "us-east-1";
}

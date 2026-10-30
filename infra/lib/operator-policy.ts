import { Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * What the `ip6-deploy` CLI user may do, replacing AdministratorAccess.
 *
 * - Infrastructure changes only through CloudFormation: the user can assume
 *   the CDK bootstrap roles (cdk deploy / diff), never change IAM directly.
 * - Read everything (ReadOnlyAccess, attached alongside) for audits and support.
 * - The few writes the project's scripts and upkeep need, each scoped to IP6
 *   resources: app secrets, the Amplify app, the media bucket and its CDN,
 *   the ip6 tables, the two Cognito pools and SES from the site's domain.
 *
 * Deploys from GitHub use the keyless `ip6-github-deploy` role instead
 * (ci-stack.ts); this user is for local maintenance.
 */
export function operatorStatements(stack: Stack, amplifyAppArn: string): iam.PolicyStatement[] {
  const { account } = stack;
  const arn = (service: string, region: string, resource: string) => `arn:aws:${service}:${region}:${account}:${resource}`;
  return [
    new iam.PolicyStatement({
      sid: "CdkDeploys",
      actions: ["sts:AssumeRole", "sts:TagSession"],
      resources: [`arn:aws:iam::${account}:role/cdk-hnb659fds-*`],
    }),
    new iam.PolicyStatement({
      sid: "AppSecrets",
      actions: ["secretsmanager:GetSecretValue", "secretsmanager:PutSecretValue", "secretsmanager:DescribeSecret"],
      resources: [arn("secretsmanager", "us-east-1", "secret:ip6/*")],
    }),
    new iam.PolicyStatement({
      sid: "AmplifyApp",
      actions: ["amplify:StartJob", "amplify:StopJob", "amplify:UpdateApp", "amplify:UpdateBranch", "amplify:CreateDeployment", "amplify:StartDeployment"],
      resources: [amplifyAppArn, `${amplifyAppArn}/*`],
    }),
    new iam.PolicyStatement({
      sid: "MediaAssets",
      actions: ["s3:PutObject", "s3:DeleteObject"],
      resources: ["arn:aws:s3:::ip6original-assets-*/*"],
    }),
    new iam.PolicyStatement({
      sid: "MediaCdn",
      actions: ["cloudfront:CreateInvalidation"],
      resources: [`arn:aws:cloudfront::${account}:distribution/*`],
    }),
    new iam.PolicyStatement({
      sid: "AppData",
      actions: ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:BatchWriteItem"],
      resources: [arn("dynamodb", "us-east-1", "table/ip6_*")],
    }),
    new iam.PolicyStatement({
      sid: "StaffAccounts",
      actions: [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminUserGlobalSignOut",
        "cognito-idp:AdminResetUserPassword",
      ],
      resources: [arn("cognito-idp", "us-east-1", "userpool/*")],
    }),
    new iam.PolicyStatement({
      sid: "TestEmail",
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: [arn("ses", "us-east-1", "identity/ip6original.com"), arn("ses", "us-east-1", "configuration-set/*")],
    }),
    new iam.PolicyStatement({
      sid: "OwnAccessKeys",
      actions: ["iam:ListAccessKeys", "iam:CreateAccessKey", "iam:UpdateAccessKey", "iam:DeleteAccessKey", "iam:GetAccessKeyLastUsed"],
      resources: [`arn:aws:iam::${account}:user/\${aws:username}`],
    }),
  ];
}

# Infrastructure (AWS CDK)

Everything the storefront needs in AWS account 462457677196, as code. Four stacks:

| Stack | Region | What it holds |
|---|---|---|
| `Ip6AccountStack` | us-east-1 | Account guardrails: CloudTrail (all regions, file validation, 400-day S3 and 1-year CloudWatch retention), CIS-style security alarms (root use, IAM changes, trail changes, console sign-in failures, KMS key disablement, bursts of denied calls), GuardDuty, IAM Access Analyzer, a monthly cost budget, SES reputation alarms, and the WAF web ACL attached to the Amplify app. Owns the `ip6-alerts` SNS topic. |
| `Ip6MonitoringStack` | us-east-2 | Availability alarms on the Amplify Hosting app (5xx, p90 latency, 4xx spikes). Lives in the app's region because that is where Amplify publishes metrics. |
| `Ip6StagingStack` | us-east-1 | One full environment: DynamoDB tables (KMS-encrypted), customer and staff Cognito pools, S3 assets bucket behind CloudFront, SES identity, configuration set and templates, Secrets Manager secrets, and the least-privilege runtime role for Amplify. |
| `Ip6ProdStack` | us-east-1 | The same environment for production. Tables keep point-in-time recovery and deletion protection, the bucket is versioned, and every resource is retained if the stack is ever deleted. |

Regions are pinned in `bin/app.ts`; the CLI profile's default region is ignored.

## Prerequisites

```bash
npm install
aws sts get-caller-identity --profile ip6     # must return account 462457677196
```

Both regions are bootstrapped (`CDKToolkit` in us-east-1 and us-east-2).

## Deploy

```bash
AWS_PROFILE=ip6 npx cdk diff --all
AWS_PROFILE=ip6 npx cdk deploy --all --concurrency 4
```

Or one stack at a time with `npm run diff:prod`, `npm run deploy:prod`, `npm run deploy:staging`.

Deploys change IAM, so the `ip6-security-IamChanged` alarm fires during every deploy. That is expected.

## Outputs

Each environment stack prints every value the app needs (`UserPoolId`, `UserPoolClientId`, `StaffUserPoolId`, `StaffUserPoolClientId`, `AssetsBucketName`, `CloudfrontDomain`, `TablePrefix`, `SesConfigurationSet`, `AppComputeRoleArn`, the secret ARNs) plus the three `DkimCname*` records to create at the domain's DNS host so SES can verify the sending domain.

Production values go into the Amplify app's environment variables and its SSR compute role (`AppComputeRoleArn`). Staging values go into `.env.staging` for local development. See `docs/ADMIN.md` for the full go-live sequence.

## Alerts

Every alarm, GuardDuty finding, Access Analyzer finding, SES bounce or complaint, and budget notification is emailed to the address in `bin/app.ts` (`ALERT_EMAIL`). The subscription must be confirmed once from the email AWS sends.

## Secrets

The stacks create `ip6/<env>/stripe`, `ip6/<env>/sanity`, `ip6/<env>/algolia` with placeholder values and `ip6/<env>/app` with a generated value. Put real values in with `aws secretsmanager put-secret-value`; never in the repo or in Amplify environment variables.

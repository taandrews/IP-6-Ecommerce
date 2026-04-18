# Infrastructure (AWS CDK)

Provisions every AWS resource this app needs:

- DynamoDB tables (Users, Orders, OrderItems, Products, Inventory, Subscriptions, Reviews, DiscountCodes, AnalyticsDaily)
- Cognito user pool + client + admin group
- S3 assets bucket + CloudFront distribution
- SES templates (order confirmation, shipping notification, subscription events, password reset)
- Amplify app configuration (manual — domain in Route 53)

## Prerequisites

```bash
# One-time
npm install -g aws-cdk
cdk bootstrap aws://<account>/<region>
```

## Deploy

```bash
cd infra
npm install
npm run deploy:staging
npm run deploy:prod
```

## Outputs

After deploy, the stack outputs every value you need in `.env.local` / Amplify env:

- `UserPoolId`, `UserPoolClientId`
- `AssetsBucketName`, `CloudfrontDomain`
- Table names (already deterministic via `DYNAMODB_TABLE_PREFIX`)

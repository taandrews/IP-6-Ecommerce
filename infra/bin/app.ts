#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { Ip6Stack } from "../lib/ip6-stack";
import { Ip6AccountStack } from "../lib/account-stack";
import { Ip6MonitoringStack } from "../lib/monitoring-stack";
import { Ip6CiStack } from "../lib/ci-stack";

// Everything except Amplify Hosting lives in us-east-1 (the CDK bootstrap,
// IAM/CloudTrail global events, CloudFront metrics, and the CLOUDFRONT-scoped
// WAF all require it). The region is pinned so a CLI profile defaulting to
// another region can never place a stack elsewhere.
const REGION = "us-east-1";
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Amplify Hosting app for the storefront (created in the console; lives in us-east-2).
const AMPLIFY_APP_ID = "d1ypn0wsqjh17o";
const AMPLIFY_REGION = "us-east-2";

// Every alert (security, availability, cost, email reputation) goes here.
const ALERT_EMAIL = "taandrews@init1s.com";
const MONTHLY_BUDGET_USD = 50;

const app = new App();

// Keyless GitHub Actions deploys (replaces the ip6-deploy access key).
new Ip6CiStack(app, "Ip6CiStack", {
  env: { account, region: REGION },
  githubRepo: "taandrews/IP-6-Ecommerce",
  environment: "production",
});

const accountStack = new Ip6AccountStack(app, "Ip6AccountStack", {
  env: { account, region: REGION },
  alertEmail: ALERT_EMAIL,
  monthlyBudgetUsd: MONTHLY_BUDGET_USD,
  amplifyAppId: AMPLIFY_APP_ID,
  amplifyRegion: AMPLIFY_REGION,
});

new Ip6MonitoringStack(app, "Ip6MonitoringStack", {
  env: { account, region: AMPLIFY_REGION },
  alertEmail: ALERT_EMAIL,
  amplifyAppId: AMPLIFY_APP_ID,
});

new Ip6Stack(app, "Ip6StagingStack", {
  env: { account, region: REGION },
  environment: "staging",
  tablePrefix: "ip6_staging_",
  domainName: "staging.ip6original.com",
  alertsTopicArn: accountStack.alertsTopic.topicArn,
});

new Ip6Stack(app, "Ip6ProdStack", {
  env: { account, region: REGION },
  environment: "prod",
  tablePrefix: "ip6_prod_",
  domainName: "ip6original.com",
  alertsTopicArn: accountStack.alertsTopic.topicArn,
  amplifyAppId: AMPLIFY_APP_ID,
  amplifyRegion: AMPLIFY_REGION,
});

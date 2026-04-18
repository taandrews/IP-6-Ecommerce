#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { Ip6Stack } from "../lib/ip6-stack";

const app = new App();

new Ip6Stack(app, "Ip6StagingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  environment: "staging",
  tablePrefix: "ip6_staging_",
  domainName: "staging.ip6original.com",
});

new Ip6Stack(app, "Ip6ProdStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  environment: "prod",
  tablePrefix: "ip6_prod_",
  domainName: "ip6original.com",
});

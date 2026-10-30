import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export interface Ip6CiStackProps extends StackProps {
  /** GitHub repository allowed to deploy, as owner/name. */
  githubRepo: string;
  /** GitHub environment the deploy job runs in (it carries the required reviewers). */
  environment: string;
}

/**
 * Keyless deploys from GitHub Actions. GitHub signs a short-lived token for
 * each workflow run; AWS trades it for temporary credentials on this role.
 * Only jobs in the named repo's protected environment can assume it (a
 * reviewer approves each deploy in GitHub), and the role can do nothing
 * except hand off to the CDK bootstrap roles, so there is no long-lived key.
 */
export class Ip6CiStack extends Stack {
  constructor(scope: Construct, id: string, props: Ip6CiStackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, "GitHubOidc", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    const role = new iam.Role(this, "GitHubDeployRole", {
      roleName: "ip6-github-deploy",
      description: `CDK deploys from ${props.githubRepo} (environment ${props.environment})`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          // Only jobs in the protected environment, which needs a reviewer's approval.
          "token.actions.githubusercontent.com:sub": `repo:${props.githubRepo}:environment:${props.environment}`,
        },
      }),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "UseCdkBootstrapRoles",
        actions: ["sts:AssumeRole", "sts:TagSession"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`],
      }),
    );

    new CfnOutput(this, "DeployRoleArn", { value: role.roleArn });
  }
}

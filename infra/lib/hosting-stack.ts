import { Stack, type StackProps } from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import type { Construct } from "constructs";

export interface Ip6HostingStackProps extends StackProps {
  /** The Amplify Hosting app (created in the console) and its production branch. */
  amplifyAppId: string;
  branchName: string;
  /** The registered domain; DNS is hosted at GoDaddy. */
  domainName: string;
}

/**
 * Custom domains for the Amplify app, with an Amplify-managed certificate.
 *
 * - admin.<domain>: the staff portal's permanent sign-in address, used in
 *   staff invitations. Independent of the storefront domain move.
 * - The storefront hostnames (apex and www) join this association at the
 *   domain cut-over.
 *
 * Amplify shows the DNS records to add at the registrar (a certificate
 * verification CNAME and one CNAME per subdomain) once this is created.
 */
export class Ip6HostingStack extends Stack {
  constructor(scope: Construct, id: string, props: Ip6HostingStackProps) {
    super(scope, id, props);

    new amplify.CfnDomain(this, "SiteDomain", {
      appId: props.amplifyAppId,
      domainName: props.domainName,
      subDomainSettings: [{ prefix: "admin", branchName: props.branchName }],
      // No certificateSettings: Amplify issues and renews its own certificate
      // by default. (Passing certificateType AMPLIFY_MANAGED through
      // CloudFormation is rejected as a custom certificate without an ARN.)
      enableAutoSubDomain: false,
    });
  }
}

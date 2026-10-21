import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
  Duration,
  SecretValue,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ses from "aws-cdk-lib/aws-ses";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as kms from "aws-cdk-lib/aws-kms";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cwactions from "aws-cdk-lib/aws-cloudwatch-actions";

export interface Ip6StackProps extends StackProps {
  environment: "staging" | "prod";
  tablePrefix: string;
  domainName: string;
  /** Account-wide alert topic (from Ip6AccountStack); bounces, complaints and CDN errors go here. */
  alertsTopicArn: string;
}

export class Ip6Stack extends Stack {
  constructor(scope: Construct, id: string, props: Ip6StackProps) {
    super(scope, id, props);

    const isProd = props.environment === "prod";
    const alertsTopic = sns.Topic.fromTopicArn(this, "AlertsTopic", props.alertsTopicArn);
    const removal = isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const billing = dynamodb.BillingMode.PAY_PER_REQUEST;

    // Customer-managed key for every table that holds personal or order data.
    // Rotated yearly; the app role below is the only principal granted use.
    const dataKey = new kms.Key(this, "DataKey", {
      alias: `alias/ip6-${props.environment}-data`,
      description: "Encrypts IP6 Original DynamoDB tables (orders, customers, audit log)",
      enableKeyRotation: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });
    const tableDefaults = {
      billingMode: billing,
      removalPolicy: removal,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dataKey,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      deletionProtection: isProd,
    } as const;

    // -----------------------
    // DynamoDB tables
    // -----------------------
    const users = new dynamodb.Table(this, "Users", {
      tableName: `${props.tablePrefix}Users`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    users.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
    });

    const orders = new dynamodb.Table(this, "Orders", {
      tableName: `${props.tablePrefix}Orders`,
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
      // Unpaid checkouts carry expiresAt and are removed after 7 days; paid orders never expire.
      timeToLiveAttribute: "expiresAt",
    });
    orders.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    orders.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    // Lookup by lower-cased email (customer history, account linking, erasure).
    orders.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "emailKey", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const orderItems = new dynamodb.Table(this, "OrderItems", {
      tableName: `${props.tablePrefix}OrderItems`,
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    orderItems.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const productsTable = new dynamodb.Table(this, "Products", {
      tableName: `${props.tablePrefix}Products`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    productsTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
    });

    const inventory = new dynamodb.Table(this, "Inventory", {
      tableName: `${props.tablePrefix}Inventory`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    inventory.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "lowStock", type: dynamodb.AttributeType.STRING },
    });

    const subs = new dynamodb.Table(this, "Subscriptions", {
      tableName: `${props.tablePrefix}Subscriptions`,
      partitionKey: { name: "subscriptionId", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    subs.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "status", type: dynamodb.AttributeType.STRING },
    });
    subs.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "nextChargeDate", type: dynamodb.AttributeType.STRING },
    });
    subs.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "emailKey", type: dynamodb.AttributeType.STRING },
    });

    const reviews = new dynamodb.Table(this, "Reviews", {
      tableName: `${props.tablePrefix}Reviews`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "reviewId", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    reviews.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    // Moderation queue: pending / published / rejected, oldest first.
    reviews.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const discounts = new dynamodb.Table(this, "DiscountCodes", {
      tableName: `${props.tablePrefix}DiscountCodes`,
      partitionKey: { name: "code", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });
    discounts.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "active", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "expiresAt", type: dynamodb.AttributeType.STRING },
    });

    // One counter row per customer per code (customer = SHA-256 of the email).
    const discountRedemptions = new dynamodb.Table(this, "DiscountRedemptions", {
      tableName: `${props.tablePrefix}DiscountRedemptions`,
      partitionKey: { name: "code", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "customer", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });

    const analytics = new dynamodb.Table(this, "AnalyticsDaily", {
      tableName: `${props.tablePrefix}AnalyticsDaily`,
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });

    // Store settings edited in the admin portal (pre-order window, site banner).
    const settings = new dynamodb.Table(this, "Settings", {
      tableName: `${props.tablePrefix}Settings`,
      partitionKey: { name: "key", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
    });

    // Who did what in the admin portal, including views and exports of customer data. Kept 2 years.
    const auditLog = new dynamodb.Table(this, "AuditLog", {
      tableName: `${props.tablePrefix}AuditLog`,
      partitionKey: { name: "month", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      timeToLiveAttribute: "expiresAt",
    });

    // Data access / deletion requests. Unverified ones expire after 48 hours.
    const privacyRequests = new dynamodb.Table(this, "PrivacyRequests", {
      tableName: `${props.tablePrefix}PrivacyRequests`,
      partitionKey: { name: "requestId", type: dynamodb.AttributeType.STRING },
      ...tableDefaults,
      timeToLiveAttribute: "expiresAt",
    });
    privacyRequests.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const appTables = [users, orders, orderItems, productsTable, inventory, subs, reviews, discounts, discountRedemptions, analytics, settings, auditLog, privacyRequests];

    // -----------------------
    // Cognito: two separate user pools
    // -----------------------
    // Customers sign themselves up. Staff are created by an owner only, must
    // use an authenticator app, and live in a different pool, so a customer
    // token can never be accepted by the admin portal.
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `ip6-${props.environment}`,
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(1),
      },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deletionProtection: isProd,
      removalPolicy: removal,
    });

    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userPassword: true, userSrp: true },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });

    const staffPool = new cognito.UserPool(this, "StaffUserPool", {
      userPoolName: `ip6-${props.environment}-staff`,
      signInAliases: { email: true },
      selfSignUpEnabled: false,
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: { otp: true, sms: false },
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(1),
      },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userInvitation: {
        emailSubject: "Your IP6 Original admin invitation",
        emailBody:
          "You've been given access to the IP6 Original admin portal. Sign in at https://" +
          props.domainName +
          "/admin/login with username {username} and temporary password {####}. It expires in 24 hours. You'll be asked to set a new password and an authenticator app.",
      },
      deletionProtection: isProd,
      removalPolicy: removal,
    });

    const staffPoolClient = staffPool.addClient("StaffWebClient", {
      authFlows: { userPassword: true },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.hours(12),
    });

    const staffGroups = [
      { name: "owner", description: "Full admin access, including refunds, exports, erasure and staff" },
      { name: "staff", description: "Fulfilment, stock, subscriptions, reviews and banner" },
      { name: "viewer", description: "Read-only; customer details masked" },
    ];
    staffGroups.forEach((g, i) => {
      new cognito.CfnUserPoolGroup(this, `StaffGroup${i}`, {
        groupName: g.name,
        userPoolId: staffPool.userPoolId,
        description: g.description,
        precedence: i,
      });
    });

    // -----------------------
    // S3 + CloudFront
    // -----------------------
    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: `ip6original-assets-${props.environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: isProd,
      removalPolicy: removal,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedHeaders: ["*"],
          maxAge: 3600,
        },
      ],
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(assetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      defaultRootObject: "",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      comment: `IP6 Original ${props.environment} CDN`,
    });

    new cloudwatch.Alarm(this, "CdnErrorRate", {
      alarmName: `ip6-${props.environment}-cdn-5xx-rate`,
      alarmDescription: "More than 5% of CDN responses were 5xx for 15 minutes",
      metric: distribution.metric5xxErrorRate({ period: Duration.minutes(5) }),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cwactions.SnsAction(alertsTopic));

    // -----------------------
    // SES: identity + templates
    // -----------------------
    const sesIdentity = new ses.EmailIdentity(this, "SesIdentity", {
      identity: ses.Identity.domain(props.domainName),
    });

    // Every message goes through this configuration set: TLS required, reputation
    // metrics on, addresses that bounced or complained are never mailed again, and
    // each bounce, complaint or rejection is reported to the alert topic.
    const sesConfigSet = new ses.ConfigurationSet(this, "SesConfigSet", {
      configurationSetName: `ip6-${props.environment}`,
      reputationMetrics: true,
      suppressionReasons: ses.SuppressionReasons.BOUNCES_AND_COMPLAINTS,
      tlsPolicy: ses.ConfigurationSetTlsPolicy.REQUIRE,
    });
    sesConfigSet.addEventDestination("Alerts", {
      destination: ses.EventDestination.snsTopic(alertsTopic),
      events: [ses.EmailSendingEvent.BOUNCE, ses.EmailSendingEvent.COMPLAINT, ses.EmailSendingEvent.REJECT],
    });

    const templates: Array<{ name: string; subject: string; html: string }> = [
      {
        name: `ip6-${props.environment}-order-confirmation`,
        subject: "IP6 Original: Order {{orderId}} confirmed",
        html: "<h1>Thank you, {{name}}.</h1><p>Your order <strong>{{orderId}}</strong> has been received.</p><p><strong>Total:</strong> {{total}}</p>",
      },
      {
        name: `ip6-${props.environment}-shipping-notification`,
        subject: "Your IP6 Original order {{orderId}} has shipped",
        html: "<h1>On its way, {{name}}.</h1><p>Order {{orderId}} has shipped via {{carrier}}. Tracking: {{tracking}}</p>",
      },
      {
        name: `ip6-${props.environment}-subscription-renewal`,
        subject: "Upcoming renewal: {{product}}",
        html: "<p>Hi {{name}}, your {{product}} subscription renews on {{chargeDate}}.</p>",
      },
      {
        name: `ip6-${props.environment}-password-reset`,
        subject: "Reset your IP6 Original password",
        html: "<p>Use this code: <strong>{{code}}</strong></p>",
      },
    ];
    templates.forEach((t, i) => {
      new ses.CfnTemplate(this, `SesTemplate${i}`, {
        template: {
          templateName: t.name,
          subjectPart: t.subject,
          htmlPart: t.html,
        },
      });
    });

    // -----------------------
    // Secrets Manager
    // -----------------------
    // One secret per third-party service. Each holds JSON with multiple keys
    // so the app fetches a single secret and pulls out the values it needs.
    // Populate real values in the AWS console after deploy.
    const stripeSecret = new secrets.Secret(this, "StripeSecret", {
      secretName: `ip6/${props.environment}/stripe`,
      description: "Stripe API keys (test mode for staging; rotate to live at launch)",
      secretObjectValue: {
        secretKey: SecretValue.unsafePlainText("sk_test_REPLACE_ME"),
        publishableKey: SecretValue.unsafePlainText("pk_test_REPLACE_ME"),
        webhookSecret: SecretValue.unsafePlainText("whsec_REPLACE_ME"),
      },
      removalPolicy: removal,
    });

    const sanitySecret = new secrets.Secret(this, "SanitySecret", {
      secretName: `ip6/${props.environment}/sanity`,
      description: "Sanity CMS project credentials",
      secretObjectValue: {
        projectId: SecretValue.unsafePlainText("REPLACE_ME"),
        dataset: SecretValue.unsafePlainText("production"),
        apiToken: SecretValue.unsafePlainText("REPLACE_ME"),
      },
      removalPolicy: removal,
    });

    const algoliaSecret = new secrets.Secret(this, "AlgoliaSecret", {
      secretName: `ip6/${props.environment}/algolia`,
      description: "Algolia app credentials",
      secretObjectValue: {
        appId: SecretValue.unsafePlainText("REPLACE_ME"),
        searchKey: SecretValue.unsafePlainText("REPLACE_ME"),
        adminKey: SecretValue.unsafePlainText("REPLACE_ME"),
      },
      removalPolicy: removal,
    });

    const appSecret = new secrets.Secret(this, "AppSecret", {
      secretName: `ip6/${props.environment}/app`,
      description: "Application-level secrets (rate limit, etc.)",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "rateLimitSecret",
        passwordLength: 64,
        excludePunctuation: true,
      },
      removalPolicy: removal,
    });

    // -----------------------
    // App runtime role (attach to the Amplify app as its SSR compute role)
    // -----------------------
    // Least privilege: data in these tables only, the two user pools only for
    // the admin calls the app makes, email from the site's own domain only,
    // and read access to the app's secrets.
    const appRole = new iam.Role(this, "AppComputeRole", {
      roleName: `ip6-${props.environment}-app`,
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      description: "Runtime permissions for the IP6 Original Next.js app on Amplify",
    });
    appTables.forEach((t) => t.grantReadWriteData(appRole));
    appRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminDisableUser",
          "cognito-idp:AdminEnableUser",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:AdminUserGlobalSignOut",
          "cognito-idp:ListUsers",
          "cognito-idp:ListUsersInGroup",
        ],
        resources: [userPool.userPoolArn, staffPool.userPoolArn],
      }),
    );
    appRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: [
          `arn:aws:ses:${this.region}:${this.account}:identity/${sesIdentity.emailIdentityName}`,
          `arn:aws:ses:${this.region}:${this.account}:configuration-set/${sesConfigSet.configurationSetName}`,
        ],
      }),
    );
    [stripeSecret, sanitySecret, algoliaSecret, appSecret].forEach((s) => s.grantRead(appRole));

    // -----------------------
    // Outputs
    // -----------------------
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, "AssetsBucketName", { value: assetsBucket.bucketName });
    new CfnOutput(this, "CloudfrontDomain", { value: distribution.distributionDomainName });
    new CfnOutput(this, "TablePrefix", { value: props.tablePrefix });
    new CfnOutput(this, "StripeSecretArn", { value: stripeSecret.secretArn });
    new CfnOutput(this, "SanitySecretArn", { value: sanitySecret.secretArn });
    new CfnOutput(this, "AlgoliaSecretArn", { value: algoliaSecret.secretArn });
    new CfnOutput(this, "AppSecretArn", { value: appSecret.secretArn });
    new CfnOutput(this, "StaffUserPoolId", { value: staffPool.userPoolId });
    new CfnOutput(this, "StaffUserPoolClientId", { value: staffPoolClient.userPoolClientId });
    new CfnOutput(this, "DataKeyArn", { value: dataKey.keyArn });
    new CfnOutput(this, "AppComputeRoleArn", { value: appRole.roleArn });
    new CfnOutput(this, "SesConfigurationSet", { value: sesConfigSet.configurationSetName });
    // Easy DKIM: create these three CNAME records at the DNS host of the domain; SES then verifies the identity.
    sesIdentity.dkimRecords.forEach((r, i) => {
      new CfnOutput(this, `DkimCname${i + 1}Name`, { value: r.name });
      new CfnOutput(this, `DkimCname${i + 1}Value`, { value: r.value });
    });
  }
}

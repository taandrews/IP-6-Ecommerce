import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ses from "aws-cdk-lib/aws-ses";

export interface Ip6StackProps extends StackProps {
  environment: "staging" | "prod";
  tablePrefix: string;
  domainName: string;
}

export class Ip6Stack extends Stack {
  constructor(scope: Construct, id: string, props: Ip6StackProps) {
    super(scope, id, props);

    const isProd = props.environment === "prod";
    const removal = isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const billing = dynamodb.BillingMode.PAY_PER_REQUEST;

    // -----------------------
    // DynamoDB tables
    // -----------------------
    const users = new dynamodb.Table(this, "Users", {
      tableName: `${props.tablePrefix}Users`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
      pointInTimeRecovery: isProd,
    });
    users.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
    });

    const orders = new dynamodb.Table(this, "Orders", {
      tableName: `${props.tablePrefix}Orders`,
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
      pointInTimeRecovery: isProd,
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

    const orderItems = new dynamodb.Table(this, "OrderItems", {
      tableName: `${props.tablePrefix}OrderItems`,
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });
    orderItems.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const productsTable = new dynamodb.Table(this, "Products", {
      tableName: `${props.tablePrefix}Products`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });
    productsTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
    });

    const inventory = new dynamodb.Table(this, "Inventory", {
      tableName: `${props.tablePrefix}Inventory`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });
    inventory.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "lowStock", type: dynamodb.AttributeType.STRING },
    });

    const subs = new dynamodb.Table(this, "Subscriptions", {
      tableName: `${props.tablePrefix}Subscriptions`,
      partitionKey: { name: "subscriptionId", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
      pointInTimeRecovery: isProd,
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

    const reviews = new dynamodb.Table(this, "Reviews", {
      tableName: `${props.tablePrefix}Reviews`,
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "reviewId", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });
    reviews.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const discounts = new dynamodb.Table(this, "DiscountCodes", {
      tableName: `${props.tablePrefix}DiscountCodes`,
      partitionKey: { name: "code", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });
    discounts.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "active", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "expiresAt", type: dynamodb.AttributeType.STRING },
    });

    new dynamodb.Table(this, "AnalyticsDaily", {
      tableName: `${props.tablePrefix}AnalyticsDaily`,
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      billingMode: billing,
      removalPolicy: removal,
    });

    // -----------------------
    // Cognito user pool
    // -----------------------
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
      removalPolicy: removal,
    });

    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userPassword: true, userSrp: true },
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });

    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      groupName: "admin",
      userPoolId: userPool.userPoolId,
      description: "Administrative users with access to /admin",
    });

    // -----------------------
    // S3 + CloudFront
    // -----------------------
    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: `ip6original-assets-${props.environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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
      comment: `IP-6 ${props.environment} CDN`,
    });

    // -----------------------
    // SES — identity + templates
    // -----------------------
    new ses.EmailIdentity(this, "SesIdentity", {
      identity: ses.Identity.domain(props.domainName),
    });

    const templates: Array<{ name: string; subject: string; html: string }> = [
      {
        name: `ip6-${props.environment}-order-confirmation`,
        subject: "Order {{orderId}} confirmed — IP-6 Research",
        html: "<h1>Thank you, {{name}}.</h1><p>Your order <strong>{{orderId}}</strong> has been received.</p><p><strong>Total:</strong> {{total}}</p>",
      },
      {
        name: `ip6-${props.environment}-shipping-notification`,
        subject: "Your IP-6 order {{orderId}} has shipped",
        html: "<h1>On its way, {{name}}.</h1><p>Order {{orderId}} has shipped via {{carrier}}. Tracking: {{tracking}}</p>",
      },
      {
        name: `ip6-${props.environment}-subscription-renewal`,
        subject: "Upcoming renewal — {{product}}",
        html: "<p>Hi {{name}}, your {{product}} subscription renews on {{chargeDate}}.</p>",
      },
      {
        name: `ip6-${props.environment}-password-reset`,
        subject: "Reset your IP-6 password",
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
    // Outputs
    // -----------------------
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, "AssetsBucketName", { value: assetsBucket.bucketName });
    new CfnOutput(this, "CloudfrontDomain", { value: distribution.distributionDomainName });
    new CfnOutput(this, "TablePrefix", { value: props.tablePrefix });
  }
}

import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudtrail from "aws-cdk-lib/aws-cloudtrail";
import { operatorStatements } from "./operator-policy";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cwactions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as guardduty from "aws-cdk-lib/aws-guardduty";
import * as accessanalyzer from "aws-cdk-lib/aws-accessanalyzer";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as iam from "aws-cdk-lib/aws-iam";

export interface Ip6AccountStackProps extends StackProps {
  /** Where every alert (security, cost, email reputation, errors) is delivered. */
  alertEmail: string;
  /** Monthly cost ceiling in USD; alerts at 80% actual and 100% forecast. */
  monthlyBudgetUsd: number;
  /** The Amplify Hosting app that serves the storefront (gets the WAF). */
  amplifyAppId: string;
  amplifyRegion: string;
}

/**
 * Account-wide guardrails, deployed once in us-east-1 (where IAM, CloudTrail
 * global events, CloudFront metrics and the CLOUDFRONT-scoped WAF live):
 *
 * - CloudTrail: every region, every management event, file validation on,
 *   kept 400 days in S3 and 1 year in CloudWatch Logs.
 * - CIS-style alarms on the trail: root use, IAM changes, trail changes,
 *   console sign-in failures, KMS key disablement, bursts of denied calls.
 * - GuardDuty and IAM Access Analyzer, with findings routed to the alert topic.
 * - A monthly budget with actual and forecast alerts.
 * - A WAF web ACL (rate limit + AWS managed rule sets) attached to Amplify.
 * - SES account reputation alarms (bounce and complaint rate).
 */
export class Ip6AccountStack extends Stack {
  readonly alertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: Ip6AccountStackProps) {
    super(scope, id, props);

    // -----------------------
    // Alert topic
    // -----------------------
    this.alertsTopic = new sns.Topic(this, "AlertsTopic", {
      topicName: "ip6-alerts",
      displayName: "IP6 Original alerts",
      enforceSSL: true,
    });
    this.alertsTopic.addSubscription(new subs.EmailSubscription(props.alertEmail));
    // The environment stacks import this topic by ARN, so the SES event destinations they
    // create (bounces, complaints) need their publish permission granted here.
    this.alertsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowSesEventPublishing",
        principals: [new iam.ServicePrincipal("ses.amazonaws.com")],
        actions: ["sns:Publish"],
        resources: [this.alertsTopic.topicArn],
        conditions: { StringEquals: { "AWS:SourceAccount": this.account } },
      }),
    );
    const alarmAction = new cwactions.SnsAction(this.alertsTopic);

    // -----------------------
    // CloudTrail
    // -----------------------
    const trailBucket = new s3.Bucket(this, "TrailBucket", {
      bucketName: `ip6-cloudtrail-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [{ storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL, transitionAfter: Duration.days(90) }],
          expiration: Duration.days(400),
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const trailLogs = new logs.LogGroup(this, "TrailLogs", {
      logGroupName: "/aws/cloudtrail/ip6",
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // CloudTrail may only write here for this account's own trail (confused-deputy guard).
    const trailArn = `arn:aws:cloudtrail:${this.region}:${this.account}:trail/ip6-account-trail`;
    trailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "OnlyThisTrail",
        effect: iam.Effect.DENY,
        principals: [new iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions: ["s3:PutObject", "s3:GetBucketAcl"],
        resources: [trailBucket.bucketArn, trailBucket.arnForObjects("*")],
        conditions: { StringNotEquals: { "aws:SourceArn": trailArn } },
      }),
    );

    new cloudtrail.Trail(this, "Trail", {
      trailName: "ip6-account-trail",
      bucket: trailBucket,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: trailLogs,
    });

    const securityFilters: Array<{ id: string; description: string; pattern: string; threshold?: number }> = [
      {
        id: "RootAccountUsed",
        description: "The root user made an API call or signed in",
        pattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
      },
      {
        id: "IamChanged",
        description: "An IAM user, role or policy was created, changed, attached or deleted",
        pattern:
          '{ ($.eventSource = "iam.amazonaws.com") && (($.eventName = Delete*) || ($.eventName = Put*) || ($.eventName = Create*) || ($.eventName = Attach*) || ($.eventName = Detach*) || ($.eventName = Update*)) }',
      },
      {
        id: "CloudTrailChanged",
        description: "CloudTrail was created, updated, deleted, started or stopped",
        pattern:
          "{ ($.eventName = CreateTrail) || ($.eventName = UpdateTrail) || ($.eventName = DeleteTrail) || ($.eventName = StartLogging) || ($.eventName = StopLogging) }",
      },
      {
        id: "ConsoleSignInFailed",
        description: "Three or more failed console sign-ins in five minutes",
        pattern: '{ ($.eventName = ConsoleLogin) && ($.errorMessage = "Failed authentication") }',
        threshold: 3,
      },
      {
        id: "KmsKeyDisabled",
        description: "A KMS key was disabled or scheduled for deletion",
        pattern: '{ ($.eventSource = "kms.amazonaws.com") && (($.eventName = DisableKey) || ($.eventName = ScheduleKeyDeletion)) }',
      },
      {
        id: "UnauthorizedCalls",
        description: "Ten or more denied API calls in five minutes",
        pattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
        threshold: 10,
      },
    ];

    for (const f of securityFilters) {
      const filter = new logs.MetricFilter(this, `${f.id}Filter`, {
        logGroup: trailLogs,
        filterPattern: logs.FilterPattern.literal(f.pattern),
        metricNamespace: "Ip6/Security",
        metricName: f.id,
        metricValue: "1",
      });
      new cloudwatch.Alarm(this, `${f.id}Alarm`, {
        alarmName: `ip6-security-${f.id}`,
        alarmDescription: f.description,
        metric: filter.metric({ statistic: "Sum", period: Duration.minutes(5) }),
        threshold: f.threshold ?? 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);
    }

    // -----------------------
    // Threat detection and access review
    // -----------------------
    new guardduty.CfnDetector(this, "GuardDuty", {
      enable: true,
      findingPublishingFrequency: "FIFTEEN_MINUTES",
    });
    new events.Rule(this, "GuardDutyFindings", {
      description: "GuardDuty findings of medium severity or higher",
      eventPattern: {
        source: ["aws.guardduty"],
        detailType: ["GuardDuty Finding"],
        detail: { severity: [{ numeric: [">=", 4] }] },
      },
      targets: [new targets.SnsTopic(this.alertsTopic)],
    });

    new accessanalyzer.CfnAnalyzer(this, "AccessAnalyzer", {
      analyzerName: "ip6-account",
      type: "ACCOUNT",
    });
    new events.Rule(this, "AccessAnalyzerFindings", {
      description: "A resource policy grants access from outside this account",
      eventPattern: {
        source: ["aws.access-analyzer"],
        detailType: ["Access Analyzer Finding"],
        detail: { status: ["ACTIVE"] },
      },
      targets: [new targets.SnsTopic(this.alertsTopic)],
    });

    // -----------------------
    // Cost
    // -----------------------
    const subscriber = { subscriptionType: "EMAIL", address: props.alertEmail };
    new budgets.CfnBudget(this, "MonthlyBudget", {
      budget: {
        budgetName: "ip6-monthly",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: props.monthlyBudgetUsd, unit: "USD" },
      },
      notificationsWithSubscribers: [
        {
          notification: { notificationType: "ACTUAL", comparisonOperator: "GREATER_THAN", threshold: 80, thresholdType: "PERCENTAGE" },
          subscribers: [subscriber],
        },
        {
          notification: { notificationType: "FORECASTED", comparisonOperator: "GREATER_THAN", threshold: 100, thresholdType: "PERCENTAGE" },
          subscribers: [subscriber],
        },
      ],
    });

    // -----------------------
    // Email reputation (account-wide SES metrics)
    // -----------------------
    const sesMetric = (name: string) =>
      new cloudwatch.Metric({ namespace: "AWS/SES", metricName: name, statistic: "Average", period: Duration.hours(1) });
    new cloudwatch.Alarm(this, "SesBounceRate", {
      alarmName: "ip6-ses-bounce-rate",
      alarmDescription: "SES bounce rate above 5% (AWS pauses sending at 10%)",
      metric: sesMetric("Reputation.BounceRate"),
      threshold: 0.05,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);
    new cloudwatch.Alarm(this, "SesComplaintRate", {
      alarmName: "ip6-ses-complaint-rate",
      alarmDescription: "SES complaint rate above 0.1% (AWS pauses sending at 0.5%)",
      metric: sesMetric("Reputation.ComplaintRate"),
      threshold: 0.001,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // -----------------------
    // WAF in front of Amplify Hosting
    // -----------------------
    const visibility = (metricName: string) => ({ cloudWatchMetricsEnabled: true, sampledRequestsEnabled: true, metricName });
    const managed = (priority: number, name: string, countOnly: string[] = []): wafv2.CfnWebACL.RuleProperty => ({
      name,
      priority,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name,
          // Rules that would block legitimate storefront traffic run in count mode instead.
          ruleActionOverrides: countOnly.map((r) => ({ name: r, actionToUse: { count: {} } })),
        },
      },
      visibilityConfig: visibility(name),
    });

    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      name: "ip6-amplify",
      description: "Rate limiting and AWS managed protections for the IP6 Original storefront",
      scope: "CLOUDFRONT",
      defaultAction: { allow: {} },
      visibilityConfig: visibility("ip6-amplify"),
      rules: [
        {
          name: "RateLimitPerIp",
          priority: 0,
          action: { block: {} },
          statement: { rateBasedStatement: { limit: 2000, aggregateKeyType: "IP" } },
          visibilityConfig: visibility("RateLimitPerIp"),
        },
        managed(1, "AWSManagedRulesAmazonIpReputationList"),
        // Checkout and admin forms can post bodies larger than the 8 KB this rule allows.
        managed(2, "AWSManagedRulesCommonRuleSet", ["SizeRestrictions_BODY"]),
        managed(3, "AWSManagedRulesKnownBadInputsRuleSet"),
      ],
    });

    new wafv2.CfnWebACLAssociation(this, "WebAclAmplify", {
      resourceArn: `arn:aws:amplify:${props.amplifyRegion}:${this.account}:apps/${props.amplifyAppId}`,
      webAclArn: webAcl.attrArn,
    });

    new cloudwatch.Alarm(this, "WafBlocked", {
      alarmName: "ip6-waf-blocked-requests",
      alarmDescription: "More than 500 requests blocked by the WAF in five minutes (an attack, or a rule blocking real users)",
      metric: new cloudwatch.Metric({
        namespace: "AWS/WAFV2",
        metricName: "BlockedRequests",
        dimensionsMap: { WebACL: "ip6-amplify", Region: "us-east-1", Rule: "ALL" },
        statistic: "Sum",
        period: Duration.minutes(5),
      }),
      threshold: 500,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // -----------------------
    // Operators
    // -----------------------
    // The ip6-deploy CLI user gets read access plus a short list of scoped
    // writes through this group, in place of AdministratorAccess.
    const operators = new iam.Group(this, "Operators", {
      groupName: "ip6-operators",
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess")],
    });
    new iam.ManagedPolicy(this, "OperatorPolicy", {
      managedPolicyName: "ip6-operator",
      description: "Scoped writes for IP6 maintenance; infrastructure changes go through CDK",
      statements: operatorStatements(this, `arn:aws:amplify:${props.amplifyRegion}:${this.account}:apps/${props.amplifyAppId}`),
      groups: [operators],
    });
    new iam.CfnUserToGroupAddition(this, "DeployUserIsOperator", { groupName: operators.groupName, users: ["ip6-deploy"] });

    new CfnOutput(this, "AlertsTopicArn", { value: this.alertsTopic.topicArn });
    new CfnOutput(this, "WebAclArn", { value: webAcl.attrArn });
    new CfnOutput(this, "TrailBucketName", { value: trailBucket.bucketName });
  }
}

import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cwactions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export interface Ip6MonitoringStackProps extends StackProps {
  alertEmail: string;
  amplifyAppId: string;
}

/**
 * Availability alarms for the Amplify Hosting app. Amplify publishes its
 * metrics in the app's own region, and a CloudWatch alarm can only notify a
 * topic in its own region, so this stack lives next to the app (us-east-2)
 * with its own copy of the alert topic.
 */
export class Ip6MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: Ip6MonitoringStackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, "AlertsTopic", {
      topicName: "ip6-alerts",
      displayName: "IP6 Original alerts (site availability)",
      enforceSSL: true,
    });
    topic.addSubscription(new subs.EmailSubscription(props.alertEmail));
    const alarmAction = new cwactions.SnsAction(topic);

    const metric = (metricName: string, statistic: string, minutes = 5) =>
      new cloudwatch.Metric({
        namespace: "AWS/AmplifyHosting",
        metricName,
        dimensionsMap: { App: props.amplifyAppId },
        statistic,
        period: Duration.minutes(minutes),
      });

    new cloudwatch.Alarm(this, "ServerErrors", {
      alarmName: "ip6-site-5xx",
      alarmDescription: "Ten or more 5xx responses from the storefront in five minutes",
      metric: metric("5xxErrors", "Sum"),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    new cloudwatch.Alarm(this, "SlowResponses", {
      alarmName: "ip6-site-latency-p90",
      alarmDescription: "Storefront p90 latency above 3 seconds for 15 minutes",
      metric: metric("Latency", "p90"),
      threshold: 3000,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    new cloudwatch.Alarm(this, "ClientErrorSpike", {
      alarmName: "ip6-site-4xx-spike",
      alarmDescription: "More than 500 4xx responses in five minutes (scanning, broken links after a deploy, or a bad redirect)",
      metric: metric("4xxErrors", "Sum"),
      threshold: 500,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    new CfnOutput(this, "AlertsTopicArn", { value: topic.topicArn });
  }
}

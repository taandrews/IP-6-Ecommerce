import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "us-east-1";
const prefix = process.env.DYNAMODB_TABLE_PREFIX ?? "ip6_prod_";

const client = new DynamoDBClient({
  region,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
});

export const TABLES = {
  Users: `${prefix}Users`,
  Orders: `${prefix}Orders`,
  OrderItems: `${prefix}OrderItems`,
  Products: `${prefix}Products`,
  Inventory: `${prefix}Inventory`,
  Subscriptions: `${prefix}Subscriptions`,
  Reviews: `${prefix}Reviews`,
  DiscountCodes: `${prefix}DiscountCodes`,
  AnalyticsDaily: `${prefix}AnalyticsDaily`,
} as const;

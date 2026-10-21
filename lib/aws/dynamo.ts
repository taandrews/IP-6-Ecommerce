import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "us-east-1";
const prefix = process.env.DYNAMODB_TABLE_PREFIX ?? "ip6_prod_";

const client = new DynamoDBClient({
  region,
  // Only for a local DynamoDB emulator during testing.
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
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
  DiscountRedemptions: `${prefix}DiscountRedemptions`,
  AnalyticsDaily: `${prefix}AnalyticsDaily`,
  Settings: `${prefix}Settings`,
  AuditLog: `${prefix}AuditLog`,
  PrivacyRequests: `${prefix}PrivacyRequests`,
} as const;

/** Index names, matching infra/lib/ip6-stack.ts. */
export const INDEXES = {
  ordersByUser: "GSI1",
  ordersByStatus: "GSI2",
  ordersByEmail: "GSI3",
  orderItemsBySku: "GSI1",
  inventoryLowStock: "GSI1",
  subscriptionsByUser: "GSI1",
  subscriptionsByStatus: "GSI2",
  subscriptionsByEmail: "GSI3",
  reviewsByUser: "GSI1",
  reviewsByStatus: "GSI2",
  privacyByStatus: "GSI1",
  usersByEmail: "GSI1",
} as const;

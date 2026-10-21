import "server-only";
import crypto from "node:crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import type { AuditEntry } from "@/types/records";
import { decodeCursor, encodeCursor } from "./cursor";

/** Activity is kept for two years, then expires automatically. */
const RETENTION_SECONDS = 60 * 60 * 24 * 730;

export interface AuditActor {
  sub: string;
  email: string;
  role: string;
}

/**
 * Records who did what in the admin portal, including who viewed or exported
 * personal data. Detail values must not contain personal data themselves:
 * pass ids (order id, customer id), never addresses or payment details.
 */
export async function audit(
  actor: AuditActor,
  action: string,
  target?: string,
  detail?: AuditEntry["detail"],
  ip?: string,
) {
  const now = new Date();
  const at = now.toISOString();
  const entry: AuditEntry = {
    month: at.slice(0, 7),
    sk: `${at}#${crypto.randomBytes(4).toString("hex")}`,
    at,
    actorSub: actor.sub,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    target,
    detail,
    ip,
    expiresAt: Math.floor(now.getTime() / 1000) + RETENTION_SECONDS,
  };
  try {
    await docClient.send(new PutCommand({ TableName: TABLES.AuditLog, Item: entry }));
  } catch (err) {
    // An audit failure must be visible in the logs but must not leak data.
    console.error("[audit] write failed", action, (err as Error).name);
  }
}

export async function listAudit(month: string, cursor?: string, limit = 50) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.AuditLog,
      KeyConditionExpression: "#m = :m",
      ExpressionAttributeNames: { "#m": "month" },
      ExpressionAttributeValues: { ":m": month },
      ScanIndexForward: false,
      Limit: Math.min(limit, 100),
      ExclusiveStartKey: decodeCursor(cursor, ["month", "sk"]),
    }),
  );
  return {
    entries: (res.Items ?? []) as AuditEntry[],
    cursor: encodeCursor(res.LastEvaluatedKey),
  };
}

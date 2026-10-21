import "server-only";
import crypto from "node:crypto";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, INDEXES, TABLES } from "@/lib/aws/dynamo";
import type { PrivacyRequestRecord, PrivacyRequestStatus, PrivacyRequestType } from "@/types/records";
import { emailKey } from "./orders";

/** Unverified requests are discarded after 48 hours. */
const VERIFY_TTL_SECONDS = 60 * 60 * 48;
/** Completed request records are kept 2 years as proof the request was handled, then expire. */
const KEEP_SECONDS = 60 * 60 * 24 * 730;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPrivacyRequest(input: {
  type: PrivacyRequestType;
  email: string;
  userId?: string;
  details?: string;
  verified: boolean;
}): Promise<{ record: PrivacyRequestRecord; token?: string }> {
  const now = new Date();
  const token = input.verified ? undefined : crypto.randomBytes(32).toString("base64url");
  const record: PrivacyRequestRecord = {
    requestId: `pr_${crypto.randomBytes(9).toString("base64url")}`,
    type: input.type,
    status: input.verified ? "open" : "unverified",
    email: input.email.trim(),
    emailKey: emailKey(input.email),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.details ? { details: input.details.slice(0, 2000) } : {}),
    ...(token ? { verifyTokenHash: hashToken(token) } : {}),
    ...(input.verified ? { verifiedAt: now.toISOString() } : {}),
    createdAt: now.toISOString(),
    ...(input.verified ? {} : { expiresAt: Math.floor(now.getTime() / 1000) + VERIFY_TTL_SECONDS }),
  };
  await docClient.send(new PutCommand({ TableName: TABLES.PrivacyRequests, Item: record }));
  return { record, token };
}

export async function getPrivacyRequest(requestId: string) {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.PrivacyRequests, Key: { requestId } }));
  return (res.Item as PrivacyRequestRecord | undefined) ?? null;
}

/** Confirms an emailed link. Constant-time comparison of the token hash. */
export async function verifyPrivacyRequest(requestId: string, token: string) {
  const rec = await getPrivacyRequest(requestId);
  if (!rec || rec.status !== "unverified" || !rec.verifyTokenHash) return null;
  if (rec.expiresAt && rec.expiresAt * 1000 < Date.now()) return null;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(rec.verifyTokenHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.PrivacyRequests,
      Key: { requestId },
      UpdateExpression: "SET #s = :open, verifiedAt = :now REMOVE verifyTokenHash, expiresAt",
      ConditionExpression: "#s = :unverified",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":open": "open", ":unverified": "unverified", ":now": new Date().toISOString() },
    }),
  );
  return { ...rec, status: "open" as const };
}

export async function listPrivacyRequests(status: PrivacyRequestStatus) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.PrivacyRequests,
      IndexName: INDEXES.privacyByStatus,
      KeyConditionExpression: "#s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status },
      ScanIndexForward: true,
      Limit: 100,
    }),
  );
  return (res.Items ?? []) as PrivacyRequestRecord[];
}

export async function closePrivacyRequest(requestId: string, status: "completed" | "rejected", actor: string, resolution: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.PrivacyRequests,
      Key: { requestId },
      UpdateExpression: "SET #s = :s, completedAt = :now, completedBy = :a, resolution = :r, expiresAt = :exp",
      ConditionExpression: "#s = :open",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":open": "open",
        ":now": new Date().toISOString(),
        ":a": actor,
        ":r": resolution.slice(0, 500),
        ":exp": Math.floor(Date.now() / 1000) + KEEP_SECONDS,
      },
    }),
  );
}

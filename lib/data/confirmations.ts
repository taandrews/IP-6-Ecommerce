import "server-only";
import crypto from "node:crypto";
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { hit } from "@/lib/rate-limit";
import { emailKey } from "./orders";
import { newsletterKey } from "./customers";
import { waitlistKey } from "./waitlist";

/**
 * Double opt-in for the newsletter and the launch waitlist. A sign-up is
 * saved as pending; the person is only on the list after clicking the link
 * we email to that address, which proves they own it and is the record of
 * consent. The link carries a random token, never the email address; the
 * token's hash points at the sign-up and is kept for 48 hours, once.
 */
export type ConfirmKind = "newsletter" | "waitlist";

const TTL_SECONDS = 60 * 60 * 48;
const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const storeKey = (token: string) => `confirm:${hash(token)}`;

function siteOrigin(req: Request) {
  // Never build an emailed link from the request's Host header (it can be
  // spoofed to send the token to another site). Production uses the configured origin.
  const configured = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  return configured ?? new URL(req.url).origin;
}

/**
 * Emails a confirmation link for a pending sign-up. At most one email per
 * address and list an hour, so the form can't be used to flood an inbox.
 */
export async function requestConfirmation(req: Request, kind: ConfirmKind, email: string, consentVersion: string) {
  if (!(await hit(`confirm-mail:${kind}:${emailKey(email)}`, 1, 3600))) return;
  const token = crypto.randomBytes(32).toString("base64url");
  await docClient.send(
    new PutCommand({
      TableName: TABLES.RateLimits,
      Item: { key: storeKey(token), kind, email: emailKey(email), consentVersion, expiresAt: Math.floor(Date.now() / 1000) + TTL_SECONDS },
    }),
  );
  const link = `${siteOrigin(req)}/api/confirm?token=${encodeURIComponent(token)}`;
  const msg = kind === "newsletter" ? emailTemplates.newsletterConfirm(link) : emailTemplates.waitlistConfirm(link);
  await sendEmailSafe(email, msg, `${kind} confirm`);
}

/**
 * Confirms the sign-up a link belongs to. Single use: the token record is
 * deleted with a condition, so a second click (or a race) does nothing.
 */
export async function confirmSignup(token: string): Promise<ConfirmKind | null> {
  const key = storeKey(token);
  const res = await docClient.send(new GetCommand({ TableName: TABLES.RateLimits, Key: { key }, ConsistentRead: true }));
  const rec = res.Item as { kind?: ConfirmKind; email?: string; consentVersion?: string; expiresAt?: number } | undefined;
  if (!rec?.kind || !rec.email || !rec.expiresAt || rec.expiresAt * 1000 < Date.now()) return null;
  try {
    await docClient.send(
      new DeleteCommand({ TableName: TABLES.RateLimits, Key: { key }, ConditionExpression: "attribute_exists(#k)", ExpressionAttributeNames: { "#k": "key" } }),
    );
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return null;
    throw err;
  }
  const now = new Date().toISOString();
  if (rec.kind === "newsletter") {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Users,
        Key: { userId: newsletterKey(rec.email) },
        // Clicking the link is the consent: its time and wording are recorded here.
        UpdateExpression: "SET #nl = :t, #ca = :now, #cv = :cv, #cf = :now, #up = :now REMOVE #un, #exp",
        ConditionExpression: "attribute_exists(userId)",
        ExpressionAttributeNames: { "#nl": "newsletter", "#ca": "consentedAt", "#cv": "consentVersion", "#cf": "confirmedAt", "#up": "updatedAt", "#un": "unsubscribedAt", "#exp": "expiresAt" },
        ExpressionAttributeValues: { ":t": true, ":now": now, ":cv": rec.consentVersion ?? "" },
      }),
    );
  } else {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Users,
        Key: { userId: waitlistKey(rec.email) },
        UpdateExpression: "SET #cf = :now, #up = :now REMOVE #exp",
        ConditionExpression: "attribute_exists(userId)",
        ExpressionAttributeNames: { "#cf": "confirmedAt", "#up": "updatedAt", "#exp": "expiresAt" },
        ExpressionAttributeValues: { ":now": now },
      }),
    );
  }
  return rec.kind;
}

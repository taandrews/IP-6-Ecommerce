import "server-only";
import { NextResponse } from "next/server";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { clientIpFrom } from "@/lib/client-ip";

/**
 * Fixed-window counter shared by every server instance (the middleware's own
 * limiter only sees one instance). Each window is one DynamoDB item that
 * expires on its own. If DynamoDB is unreachable the request is allowed, so
 * an outage there never locks shoppers out.
 */
export async function hit(key: string, max: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec);
  try {
    const out = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.RateLimits,
        Key: { key: `${key}#${window}` },
        UpdateExpression: "ADD #c :one SET #exp = if_not_exists(#exp, :exp)",
        ExpressionAttributeNames: { "#c": "count", "#exp": "expiresAt" },
        ExpressionAttributeValues: { ":one": 1, ":exp": (window + 1) * windowSec + 60 },
        ReturnValues: "UPDATED_NEW",
      }),
    );
    return Number(out.Attributes?.count ?? 0) <= max;
  } catch (err) {
    console.error("[rate-limit] counter failed", (err as Error).name);
    return true;
  }
}

/**
 * Limits one route per visitor IP. Returns a 429 response when the visitor is
 * over the limit, or null to carry on.
 */
export async function limitByIp(req: Request, name: string, max: number, windowSec = 60) {
  const ip = clientIpFrom(req.headers);
  if (await hit(`${name}:ip:${ip}`, max, windowSec)) return null;
  return tooMany(windowSec);
}

export function tooMany(retryAfterSec: number, error = "Too many attempts. Please wait a few minutes and try again.") {
  return NextResponse.json({ error }, { status: 429, headers: { "Retry-After": String(retryAfterSec) } });
}

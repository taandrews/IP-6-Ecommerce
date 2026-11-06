import "server-only";
import { BatchGetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import type { Currency } from "@/types";
import type { DailyStats } from "@/types/records";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "AUD", "EUR", "INR"];

export function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Adds a paid order to its day's totals (atomic counters, no PII). */
export async function recordSale(at: string, currency: Currency, amountCents: number, units: number, preorder: boolean) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.AnalyticsDaily,
      Key: { date: dayKey(at) },
      UpdateExpression: "ADD orders :one, units :u, preorders :p, #rev :amt",
      ExpressionAttributeNames: { "#rev": `revenue_${currency}` },
      ExpressionAttributeValues: { ":one": 1, ":u": units, ":p": preorder ? 1 : 0, ":amt": amountCents },
    }),
  );
}

export async function recordRefund(at: string, currency: Currency, amountCents: number) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.AnalyticsDaily,
      Key: { date: dayKey(at) },
      UpdateExpression: "ADD #ref :amt",
      ExpressionAttributeNames: { "#ref": `refunds_${currency}` },
      ExpressionAttributeValues: { ":amt": amountCents },
    }),
  );
}

export function lastNDays(n: number, end = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function getDailyStats(days: string[]): Promise<DailyStats[]> {
  const found = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < days.length; i += 100) {
    const chunk = days.slice(i, i + 100);
    let keys: Record<string, unknown>[] | undefined = chunk.map((date) => ({ date }));
    while (keys?.length) {
      const res = await docClient.send(new BatchGetCommand({ RequestItems: { [TABLES.AnalyticsDaily]: { Keys: keys } } }));
      for (const item of res.Responses?.[TABLES.AnalyticsDaily] ?? []) found.set(String(item.date), item);
      keys = res.UnprocessedKeys?.[TABLES.AnalyticsDaily]?.Keys as Record<string, unknown>[] | undefined;
    }
  }
  return days.map((date) => {
    const it = found.get(date) ?? {};
    const revenue: DailyStats["revenue"] = {};
    const refunds: DailyStats["refunds"] = {};
    for (const c of CURRENCIES) {
      if (typeof it[`revenue_${c}`] === "number") revenue[c] = it[`revenue_${c}`] as number;
      if (typeof it[`refunds_${c}`] === "number") refunds[c] = it[`refunds_${c}`] as number;
    }
    return {
      date,
      orders: Number(it.orders ?? 0),
      preorders: Number(it.preorders ?? 0),
      units: Number(it.units ?? 0),
      revenue,
      refunds,
    };
  });
}

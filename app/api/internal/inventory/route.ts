import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCronKey } from "@/lib/aws/secrets";
import { EMAIL } from "@/lib/email-addresses";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { dailyReport } from "@/lib/inventory/alerts";
import { releaseOrder } from "@/lib/inventory/orders";
import { allStock, expiredHolds } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled inventory jobs, called by AWS EventBridge with the key from
 * ip6/{env}/cron:
 * - task=holds (hourly): releases checkout holds whose time ran out without
 *   Stripe's expiry notice arriving, so stock is never stuck.
 * - task=report (daily): emails the orders@ group about lots expiring within
 *   90 days, expired lots still in stock and positions sold past their limit.
 */
export async function POST(req: Request) {
  const sent = req.headers.get("x-ip6-cron-key") ?? "";
  const expected = await getCronKey().catch(() => "");
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const task = new URL(req.url).searchParams.get("task");
  try {
    if (task === "holds") {
      const orders = await expiredHolds();
      for (const orderId of orders) await releaseOrder(orderId);
      return NextResponse.json({ released: orders.length });
    }
    if (task === "report") {
      const { positions, lots } = await allStock();
      const r = dailyReport(positions, lots);
      const line = (l: { sku: string; lotNo: string; locationId: string; onHand: number; expiresOn: string }) => `${l.sku} lot ${l.lotNo} at ${l.locationId}: ${l.onHand} units, expires ${l.expiresOn}`;
      const summary = {
        expired: r.expired.map(line),
        expiringSoon: r.expiringSoon.map(line),
        belowZero: r.belowZero.map((p) => `${p.sku} at ${p.locationId}: ${p.available} available (limit -${p.backorderLimit})`),
      };
      const any = summary.expired.length + summary.expiringSoon.length + summary.belowZero.length > 0;
      if (any) await sendEmailSafe(EMAIL.orders, emailTemplates.inventoryDailyReport(summary), "inventory report");
      return NextResponse.json({ expired: summary.expired.length, expiringSoon: summary.expiringSoon.length, belowZero: summary.belowZero.length, emailed: any });
    }
    return NextResponse.json({ error: "unknown_task" }, { status: 400 });
  } catch (err) {
    console.error("[inventory] scheduled task failed", task, (err as Error).name);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

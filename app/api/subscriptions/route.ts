import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSubscriptionsForCustomer } from "@/lib/data/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in customer's subscriptions (by account, or by verified email). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    const subs = await listSubscriptionsForCustomer(user.sub, user.emailVerified ? user.email : undefined);
    return NextResponse.json(
      {
        subscriptions: subs.map((s) => ({
          subscriptionId: s.subscriptionId,
          productName: s.productName,
          status: s.status,
          cycleDays: s.cycleDays,
          priceCents: s.priceCents,
          currency: s.currency,
          nextChargeDate: s.nextChargeDate,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[subscriptions] list failed", (err as Error).name);
    return NextResponse.json({ subscriptions: [], error: "unavailable" }, { status: 500 });
  }
}

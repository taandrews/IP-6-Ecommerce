import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSubscription, ownsSubscription } from "@/lib/data/subscriptions";
import { applySubscriptionOp, SUBSCRIPTION_OPS, type SubscriptionOp } from "@/lib/subscriptions/ops";

export const runtime = "nodejs";

/** Customer self-service. The subscription must belong to the signed-in customer. */
export async function POST(_req: Request, props: { params: Promise<{ id: string; op: string }> }) {
  const params = await props.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!SUBSCRIPTION_OPS.includes(params.op as SubscriptionOp)) return NextResponse.json({ error: "unknown_op" }, { status: 400 });
  const rec = await getSubscription(params.id);
  // Not found and not yours look the same, so ids can't be probed.
  if (!rec || !ownsSubscription(rec, user)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (rec.status === "cancelled") return NextResponse.json({ error: "already_cancelled" }, { status: 409 });
  try {
    const updated = await applySubscriptionOp(await getStripe(), rec, params.op as SubscriptionOp);
    return NextResponse.json({ ok: true, status: updated.status, nextChargeDate: updated.nextChargeDate });
  } catch (err) {
    console.error("[subscriptions] op failed", params.op, (err as Error).name);
    return NextResponse.json({ error: "We couldn't update your subscription. Please try again." }, { status: 500 });
  }
}

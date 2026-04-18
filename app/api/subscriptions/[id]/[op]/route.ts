import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/session";

const OPS = new Set(["pause", "resume", "skip", "cancel"]);

export async function POST(
  _req: Request,
  { params }: { params: { id: string; op: string } },
) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!OPS.has(params.op)) return NextResponse.json({ error: "unknown_op" }, { status: 400 });

  try {
    switch (params.op) {
      case "pause":
        await stripe.subscriptions.update(params.id, {
          pause_collection: { behavior: "void" },
        });
        break;
      case "resume":
        await stripe.subscriptions.update(params.id, { pause_collection: "" as never });
        break;
      case "skip": {
        const sub = await stripe.subscriptions.retrieve(params.id);
        if (sub.current_period_end) {
          await stripe.subscriptions.update(params.id, {
            trial_end: sub.current_period_end + 60 * 60 * 24 * 30,
            proration_behavior: "none",
          });
        }
        break;
      }
      case "cancel":
        await stripe.subscriptions.cancel(params.id);
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as { message?: string })?.message ?? "stripe_error" },
      { status: 500 },
    );
  }
}

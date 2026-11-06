import { NextResponse } from "next/server";
import { z } from "zod";
import { checkUnsubscribeToken, optOutOfCartReminders } from "@/lib/cart-reminder";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().trim().email().max(254), token: z.string().max(200) });

/** Opt-out of cart reminders; the signed link from the email is the proof. */
export async function POST(req: Request) {
  const limited = await limitByIp(req, "cart-reminders", 20);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(await checkUnsubscribeToken(parsed.data.email, parsed.data.token))) {
    return NextResponse.json({ error: "invalid_link" }, { status: 400 });
  }
  try {
    await optOutOfCartReminders(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart-reminders] opt-out failed", (err as Error).name);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

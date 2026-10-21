import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { buildExport, getCustomerProfile } from "@/lib/data/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Self-service copy of the personal data held about the signed-in customer
 * (GDPR art. 15/20, CCPA right to know). Requires a verified email so a
 * person only ever downloads orders placed with an address they control.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ error: "Verify your email to download your data." }, { status: 403 });
  try {
    const profile = await getCustomerProfile(user.email);
    // Only data linked to this login: drop orders tied to a different account.
    profile.orders = profile.orders.filter((o) => !o.userId || o.userId === user.sub);
    const body = JSON.stringify(buildExport(profile), null, 2);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="ip6original-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[account] export failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't prepare your data. Please try again." }, { status: 500 });
  }
}

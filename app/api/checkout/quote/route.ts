import { NextResponse } from "next/server";
import { CheckoutInputSchema } from "@/lib/checkout/schema";
import { buildQuote } from "@/lib/checkout/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns server-calculated totals and shipping options. Creates nothing. */
export async function POST(req: Request) {
  const parsed = CheckoutInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  try {
    const built = await buildQuote(parsed.data);
    if (!built.quote) return NextResponse.json({ error: built.error, rates: built.rates, discountMessage: built.discountMessage }, { status: 422 });
    return NextResponse.json({ quote: built.quote, rates: built.rates, discountMessage: built.discountMessage });
  } catch (err) {
    console.error("[checkout] quote failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't price your order. Please try again." }, { status: 500 });
  }
}

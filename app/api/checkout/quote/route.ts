import { NextResponse } from "next/server";
import { CheckoutInputSchema } from "@/lib/checkout/schema";
import { buildQuote } from "@/lib/checkout/build";
import { StripeConfigurationError } from "@/lib/stripe/server";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns server-calculated totals and shipping options. Creates nothing. */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "quote", 40)) ?? (await limitByIp(req, "quote-hour", 400, 3600));
  if (limited) return limited;
  const parsed = CheckoutInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  try {
    const built = await buildQuote(parsed.data);
    if (!built.quote) return NextResponse.json({ error: built.error, rates: built.rates, discountMessage: built.discountMessage, blocked: built.blocked }, { status: 422 });
    return NextResponse.json({ quote: built.quote, rates: built.rates, discountMessage: built.discountMessage });
  } catch (err) {
    console.error("[checkout] quote failed", (err as Error).name);
    if (err instanceof StripeConfigurationError) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "We couldn't price your order. Please try again." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateRates } from "@/lib/shipping";

const Body = z.object({
  items: z.array(
    z.object({
      sku: z.string(),
      variantId: z.string(),
      name: z.string(),
      variantLabel: z.string(),
      image: z.string(),
      qty: z.number().int().min(1),
      unitPriceCents: z.number().int().min(0),
      currency: z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]),
      subscription: z
        .object({ cycleDays: z.number(), discountPct: z.number() })
        .optional(),
    }),
  ),
  destinationCountry: z.string().length(2),
  destinationPostal: z.string().min(2).max(20),
  currency: z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const rates = calculateRates(parsed.data);
  return NextResponse.json({ rates });
}

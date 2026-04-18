import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, STRIPE_TAX_ENABLED } from "@/lib/stripe/server";
import { cuid } from "@/lib/utils";

const Body = z.object({
  email: z.string().email(),
  address: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().optional().nullable(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string().length(2),
    phone: z.string().optional().nullable(),
  }),
  items: z.array(
    z.object({
      sku: z.string(),
      variantId: z.string(),
      name: z.string(),
      qty: z.number().int().min(1),
      unitPriceCents: z.number().int().min(0),
      currency: z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]),
      subscription: z
        .object({ cycleDays: z.number(), discountPct: z.number() })
        .optional(),
    }),
  ),
  shipping: z.object({
    id: z.string(),
    label: z.string(),
    carrier: z.string(),
    etaDays: z.tuple([z.number(), z.number()]),
    amountCents: z.number().int().min(0),
    currency: z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]),
  }),
  currency: z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { items, shipping, currency, email, address } = parsed.data;

  const subtotal = items.reduce(
    (s, i) =>
      s + Math.round(i.unitPriceCents * i.qty * (1 - (i.subscription?.discountPct ?? 0) / 100)),
    0,
  );
  const total = subtotal + shipping.amountCents;
  const orderId = `IP6-${cuid().toUpperCase().slice(0, 12)}`;

  try {
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: currency.toLowerCase(),
      receipt_email: email,
      description: `Order ${orderId}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
        email,
        shippingCarrier: shipping.carrier,
        shippingLabel: shipping.label,
        itemCount: String(items.reduce((n, i) => n + i.qty, 0)),
        items: JSON.stringify(
          items.map((i) => ({ sku: i.sku, qty: i.qty, sub: !!i.subscription })),
        ),
        destinationCountry: address.country,
      },
      shipping: {
        name: address.name,
        phone: address.phone ?? undefined,
        address: {
          line1: address.line1,
          line2: address.line2 ?? undefined,
          city: address.city,
          state: address.region,
          postal_code: address.postalCode,
          country: address.country,
        },
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderId,
      taxEnabled: STRIPE_TAX_ENABLED,
    });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message ?? "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

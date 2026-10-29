import { NextResponse } from "next/server";
import { z } from "zod";
import { countryName, isCountryCode, isSellableCountry } from "@/lib/countries";
import { ipCountry } from "@/lib/geo";
import { saveWaitlist } from "@/lib/data/waitlist";
import { products } from "@/content/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SKUS = new Set(products.flatMap((p) => [p.sku, ...p.variants.map((v) => v.sku)]));

const Body = z.object({
  email: z.string().trim().email().max(254),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((c) => c.toUpperCase())
    .refine((c) => isCountryCode(c), "Please choose your country."),
  firstName: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || undefined),
  consent: z.literal(true),
  product: z
    .string()
    .max(60)
    .optional()
    .refine((v) => !v || SKUS.has(v)),
  page: z
    .string()
    .max(200)
    .regex(/^\/[^\s]*$/)
    .default("/"),
  source: z.enum(["product", "checkout"]),
});

/** Launch waitlist sign-up for visitors in countries we don't ship to yet. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some((i) => i.path[0] === "consent");
    return NextResponse.json(
      { error: consentMissing ? "Please tick the box so we can email you at launch." : "Please check your email and country." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  if (isSellableCountry(d.country)) {
    return NextResponse.json({ error: `We already ship to ${countryName(d.country)}. You can order now.`, sellable: true }, { status: 400 });
  }
  try {
    await saveWaitlist({
      email: d.email,
      country: d.country,
      firstName: d.firstName,
      ipCountry: ipCountry(),
      product: d.product,
      page: d.page.split("?")[0]!,
      source: d.source,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}

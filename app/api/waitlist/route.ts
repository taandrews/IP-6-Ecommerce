import { NextResponse } from "next/server";
import { z } from "zod";
import { countryInSentence, countryName, isCountryCode, isSellableCountry } from "@/lib/countries";
import { ipCountry } from "@/lib/geo";
import { saveWaitlist } from "@/lib/data/waitlist";
import { products } from "@/content/products";
import { limitByIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { requestConfirmation } from "@/lib/data/confirmations";
import { getWaitlistEntry } from "@/lib/data/waitlist";
import { WAITLIST_CONSENT_VERSION } from "@/lib/waitlist-consent";
import { CAMPAIGN_VALUE } from "@/lib/campaign";

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
  // The confirmation email greets the person by name, so a first name is required.
  firstName: z.string().trim().min(1, "Please add your first name.").max(60),
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
  source: z.enum(["product", "checkout", "arrival"]),
  // utm_* of the link that brought the visitor in (sent only with analytics consent).
  campaign: z
    .object({
      source: z.string().trim().regex(CAMPAIGN_VALUE).optional(),
      medium: z.string().trim().regex(CAMPAIGN_VALUE).optional(),
      campaign: z.string().trim().regex(CAMPAIGN_VALUE).optional(),
    })
    .strict()
    .optional()
    .catch(undefined),
  captcha: z.string().max(2048).nullish(),
});

/**
 * Launch waitlist sign-up for visitors in countries we don't ship to yet.
 * Needs a solved CAPTCHA; saved as pending until the emailed link is clicked.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "waitlist", 10)) ?? (await limitByIp(req, "waitlist-hour", 40, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.path[0];
    const error =
      first === "consent" ? "Please tick the box so we can email you at launch." : first === "firstName" ? "Please add your first name." : "Please check your email and country.";
    return NextResponse.json({ error }, { status: 400 });
  }
  const d = parsed.data;
  if (!(await verifyCaptcha(d.captcha, req, "waitlist"))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400 });
  }
  if (isSellableCountry(d.country)) {
    return NextResponse.json({ error: `We already ship to ${countryName(d.country)}. You can order now.`, sellable: true }, { status: 400 });
  }
  try {
    await saveWaitlist({
      email: d.email,
      country: d.country,
      firstName: d.firstName,
      ipCountry: await ipCountry(),
      product: d.product,
      page: d.page.split("?")[0]!,
      source: d.source,
      campaign: d.campaign && Object.keys(d.campaign).length ? d.campaign : undefined,
    });
    // Double opt-in: only a click on the emailed link confirms the sign-up.
    if (!(await getWaitlistEntry(d.email))?.confirmedAt) await requestConfirmation(req, { kind: "waitlist", firstName: d.firstName, country: countryInSentence(d.country) }, d.email, WAITLIST_CONSENT_VERSION);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { countryName, isCountryCode, isSellableCountry } from "@/lib/countries";
import { ipCountry } from "@/lib/geo";
import { saveWaitlist } from "@/lib/data/waitlist";
import { products } from "@/content/products";
import { isShopifyOrigin } from "@/lib/storefronts";
import { limitByIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { requestConfirmation } from "@/lib/data/confirmations";
import { getWaitlistEntry } from "@/lib/data/waitlist";
import { WAITLIST_CONSENT_VERSION } from "@/lib/waitlist-consent";

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
  site: z.enum(["amplify", "shopify"]).default("amplify"),
  captcha: z.string().max(2048).nullish(),
});

/** CORS for the Shopify storefront, which posts its waitlist form here. */
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return isShopifyOrigin(origin)
    ? { "Access-Control-Allow-Origin": origin!, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" }
    : {};
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

/**
 * Launch waitlist sign-up for visitors in countries we don't ship to yet.
 * Needs a solved CAPTCHA; saved as pending until the emailed link is clicked.
 */
export async function POST(req: Request) {
  const headers = cors(req);
  const limited = (await limitByIp(req, "waitlist", 10)) ?? (await limitByIp(req, "waitlist-hour", 40, 3600));
  if (limited) {
    for (const [k, v] of Object.entries(headers)) limited.headers.set(k, v);
    return limited;
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some((i) => i.path[0] === "consent");
    return NextResponse.json(
      { error: consentMissing ? "Please tick the box so we can email you at launch." : "Please check your email and country." },
      { status: 400, headers },
    );
  }
  const d = parsed.data;
  if (!(await verifyCaptcha(d.captcha, req))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400, headers });
  }
  if (isSellableCountry(d.country)) {
    return NextResponse.json({ error: `We already ship to ${countryName(d.country)}. You can order now.`, sellable: true }, { status: 400, headers });
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
      site: d.site,
    });
    // Double opt-in: only a click on the emailed link confirms the sign-up.
    if (!(await getWaitlistEntry(d.email))?.confirmedAt) await requestConfirmation(req, "waitlist", d.email, WAITLIST_CONSENT_VERSION);
    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    console.error("[waitlist] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500, headers });
  }
}

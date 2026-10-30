import { NextResponse } from "next/server";
import { newChallenge } from "@/lib/captcha";
import { limitByIp } from "@/lib/rate-limit";
import { isShopifyOrigin } from "@/lib/storefronts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CORS for the Shopify storefront's waitlist form, which uses the same puzzles. */
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return isShopifyOrigin(origin) ? { "Access-Control-Allow-Origin": origin!, Vary: "Origin" } : {};
}

/** A fresh CAPTCHA puzzle for a form (see lib/captcha.ts). */
export async function GET(req: Request) {
  const limited = await limitByIp(req, "captcha", 30);
  if (limited) return limited;
  try {
    return NextResponse.json(await newChallenge(), { headers: { "Cache-Control": "no-store", ...cors(req) } });
  } catch (err) {
    console.error("[captcha] challenge failed", (err as Error).name);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: cors(req) });
  }
}

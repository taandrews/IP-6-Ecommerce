import { confirmSignup } from "@/lib/data/confirmations";
import { confirmPage, redirectAfter } from "@/lib/confirm-page";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{40,64}$/;

/** Link from a newsletter or launch-alert confirmation email. Opening it changes nothing. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!TOKEN.test(token)) return redirectAfter(req, "/confirmed", { status: "invalid" });
  return confirmPage({
    title: "Confirm your email",
    text: "Press the button to confirm you want emails from IP6 Original. Nothing happens until you do.",
    button: "Confirm",
    action: "/api/confirm",
    fields: { token },
  });
}

/** The button on the page above. */
export async function POST(req: Request) {
  const limited = await limitByIp(req, "confirm-signup", 10);
  if (limited) return limited;
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!TOKEN.test(token)) return redirectAfter(req, "/confirmed", { status: "invalid" });
  try {
    const kind = await confirmSignup(token);
    return redirectAfter(req, "/confirmed", kind ? { status: "ok", list: kind } : { status: "invalid" });
  } catch (err) {
    console.error("[confirm] failed", (err as Error).name);
    return redirectAfter(req, "/confirmed", { status: "error" });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/aws/ses";

const Body = z.object({
  email: z.string().email(),
  details: z.string().max(2000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const adminInbox = "privacy@ip6original.com";
  try {
    await sendEmail(
      adminInbox,
      `[Privacy] Data deletion request from ${parsed.data.email}`,
      `<p>Requester: ${parsed.data.email}</p>
      ${parsed.data.details ? `<hr><p style="white-space:pre-wrap">${parsed.data.details}</p>` : ""}
      <p>Follow up within 5 business days; complete within 30 days where legally permitted.</p>`,
    );
    await sendEmail(
      parsed.data.email,
      "Deletion request received",
      `<p>We received your data deletion request and will confirm within 5 business days.</p>
      <p>If you didn't submit this request, reply to this email and we'll discard it.</p>`,
    );
  } catch (err) {
    console.error("[privacy] send failed", err);
  }
  return NextResponse.json({ ok: true });
}

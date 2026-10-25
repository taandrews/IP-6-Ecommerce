import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/aws/ses";
import { lintContent } from "@/lib/compliance/claim-linter";
import { CONTACT_INBOX, CONTACT_TOPICS } from "@/lib/email-addresses";

const Body = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  topic: z.enum(CONTACT_TOPICS),
  order: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const findings = lintContent(parsed.data.message);
  try {
    await sendEmail(
      CONTACT_INBOX[parsed.data.topic],
      `[Contact · ${parsed.data.topic}] from ${parsed.data.name}`,
      `<p><strong>From:</strong> ${escape(parsed.data.name)} &lt;${escape(parsed.data.email)}&gt;</p>
      <p><strong>Topic:</strong> ${parsed.data.topic}</p>
      ${parsed.data.order ? `<p><strong>Order:</strong> ${escape(parsed.data.order)}</p>` : ""}
      <hr>
      <p style="white-space:pre-wrap">${escape(parsed.data.message)}</p>
      ${findings.length > 0 ? `<p style="color:#C0392B">Compliance findings: ${findings.length}</p>` : ""}`,
      // Replying from the inbox goes straight to the customer.
      { sender: "hello", fromName: "IP6 Original contact form", replyTo: parsed.data.email },
    );
  } catch (err) {
    console.error("[contact] ses send failed", (err as Error).name);
    return NextResponse.json({ error: "Your message could not be sent. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

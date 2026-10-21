import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { eraseCustomer } from "@/lib/data/customers";
import { unsealEmail } from "@/lib/admin/seal";
import { closePrivacyRequest, getPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";
import { emailKey } from "@/lib/data/orders";

export const runtime = "nodejs";

const Body = z.object({
  k: z.string().min(10).max(1024),
  /** The owner must type the customer's email to confirm. */
  confirmEmail: z.string().trim().email(),
  requestId: z.string().regex(/^pr_[A-Za-z0-9_-]{8,20}$/).optional(),
  notify: z.boolean().default(true),
});

/** Owner-only right-to-erasure. Irreversible; see eraseCustomer for what is kept. */
export const POST = withAdmin("customers:delete", async (req, staff) => {
  const b = await parseBody(req, Body);
  const email = unsealEmail(b.k);
  if (!email) throw new HttpError(400, "link_expired");
  if (emailKey(b.confirmEmail) !== emailKey(email)) throw new HttpError(400, "confirmation_mismatch");
  if (b.requestId) {
    const pr = await getPrivacyRequest(b.requestId);
    if (!pr || pr.status !== "open" || pr.emailKey !== emailKey(email)) throw new HttpError(400, "request_mismatch");
  }
  const summary = await eraseCustomer(email);
  if (b.requestId) await closePrivacyRequest(b.requestId, "completed", staff.user.email, "Erased");
  if (b.notify) await sendEmailSafe(email, emailTemplates.privacyDeleted(), "erasure confirmation");
  await audit(staff.actor, "customer.erase", b.requestId ?? "direct", summary, staff.ip);
  return NextResponse.json({ ok: true, summary });
});

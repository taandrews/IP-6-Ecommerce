import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { closePrivacyRequest, getPrivacyRequest } from "@/lib/data/privacy";
import { emailTemplates, sendEmailSafe } from "@/lib/aws/ses";

export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["export_sent", "reject"]),
  resolution: z.string().trim().min(3).max(500),
});

/**
 * Closes a request that isn't an erasure (erasure is closed by the erase
 * endpoint). "export_sent" records that the data copy was delivered;
 * "reject" is for requests that can't be honoured, with the reason given.
 */
export const POST = withAdmin<{ id: string }>("privacy:manage", async (req, staff, { id }) => {
  if (!/^pr_[A-Za-z0-9_-]{8,20}$/.test(id)) throw new HttpError(404, "not_found");
  const b = await parseBody(req, Body);
  const pr = await getPrivacyRequest(id);
  if (!pr || pr.status !== "open") throw new HttpError(409, "not_open");
  if (b.action === "export_sent" && pr.type !== "export") throw new HttpError(400, "wrong_type");
  await closePrivacyRequest(id, b.action === "reject" ? "rejected" : "completed", staff.user.email, b.resolution);
  if (b.action === "export_sent") await sendEmailSafe(pr.email, emailTemplates.privacyExportReady(), "export ready");
  await audit(staff.actor, `privacy.${b.action}`, id, undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { buildExport, getCustomerProfile } from "@/lib/data/customers";
import { unsealEmail } from "@/lib/admin/seal";

export const runtime = "nodejs";

const Body = z.object({ k: z.string().min(10).max(1024) });

/** Owner-only: a customer's data copy, for answering an access/portability request. */
export const POST = withAdmin("customers:export", async (req, staff) => {
  const { k } = await parseBody(req, Body);
  const email = unsealEmail(k);
  if (!email) throw new HttpError(400, "link_expired");
  const profile = await getCustomerProfile(email);
  await audit(staff.actor, "customer.export", profile.account?.sub ?? "guest", { orders: profile.orders.length }, staff.ip);
  return new NextResponse(JSON.stringify(buildExport(profile), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="customer-data-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});

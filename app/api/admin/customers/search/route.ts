import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { audit } from "@/lib/data/audit";
import { hit } from "@/lib/rate-limit";
import { findCustomers } from "@/lib/shopify/admin";
import { sealEmail } from "@/lib/admin/seal";
import { maskEmail, maskName } from "@/lib/admin/pii";

export const runtime = "nodejs";

const Body = z.object({ q: z.string().trim().min(2).max(254) });

/**
 * Customer lookup in Shopify by email. The search term travels in the body so
 * it never lands in URLs or logs. Roles that see masked emails must type the
 * full address, so a prefix search can't rebuild a masked email.
 */
export const POST = withAdmin("customers:read", async (req, staff) => {
  const { q } = await parseBody(req, Body);
  const pii = can(staff.role, "customers:pii");
  if (!(await hit(`admin-search:${staff.user.sub}`, pii ? 300 : 60, 3600))) throw new HttpError(429, "rate_limited");
  const exact = z.string().email().safeParse(q).success;
  if (!pii && !exact) throw new HttpError(400, "full_email_required");
  const found = await findCustomers(exact ? q : `${q}*`);
  const rows = found
    .filter((c) => c.email && (pii || c.email.toLowerCase() === q.toLowerCase()))
    .map((c) => ({
      name: pii ? c.name : maskName(c.name),
      email: pii ? c.email : maskEmail(c.email),
      k: sealEmail(c.email),
      account: true,
      orders: c.orders,
    }));
  if (exact && !rows.some((r) => r.k && r.email.toLowerCase() === q.toLowerCase())) {
    // Newsletter or waitlist sign-ups without a Shopify customer can still be opened by exact email.
    rows.push({ name: "", email: pii ? q : maskEmail(q), k: sealEmail(q), account: false, orders: 0 });
  }
  await audit(staff.actor, "customers.search", undefined, { results: rows.length }, staff.ip);
  return NextResponse.json({ customers: rows });
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { audit } from "@/lib/data/audit";
import { listAccounts } from "@/lib/aws/cognito";
import { listOrdersByEmail } from "@/lib/data/orders";
import { sealEmail } from "@/lib/admin/seal";
import { maskEmail, maskName } from "@/lib/admin/pii";

export const runtime = "nodejs";

const Body = z.object({ q: z.string().trim().min(2).max(254) });

/**
 * Customer lookup by email (prefix for accounts, exact for guest checkouts).
 * The search term travels in the body so it never lands in URLs or logs.
 */
export const POST = withAdmin("customers:read", async (req, staff) => {
  const { q } = await parseBody(req, Body);
  const pii = can(staff.role, "customers:pii");
  const { accounts } = await listAccounts({ emailPrefix: q.toLowerCase(), limit: 25 });
  const rows = new Map<string, { name: string; email: string; k: string; account: boolean; createdAt?: string }>();
  for (const a of accounts) {
    rows.set(a.email.toLowerCase(), {
      name: pii ? a.name ?? "" : maskName(a.name),
      email: pii ? a.email : maskEmail(a.email),
      k: sealEmail(a.email),
      account: true,
      createdAt: a.createdAt,
    });
  }
  if (q.includes("@") && !rows.has(q.toLowerCase())) {
    const orders = await listOrdersByEmail(q, 1);
    const o = orders[0];
    if (o && !o.anonymizedAt) {
      rows.set(q.toLowerCase(), {
        name: pii ? o.customerName : maskName(o.customerName),
        email: pii ? o.email : maskEmail(o.email),
        k: sealEmail(o.email),
        account: false,
        createdAt: o.createdAt,
      });
    }
  }
  await audit(staff.actor, "customers.search", undefined, { results: rows.size }, staff.ip);
  return NextResponse.json({ customers: [...rows.values()] });
});

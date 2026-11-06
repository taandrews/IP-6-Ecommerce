import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody, HttpError } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { deleteStaff, disableStaff, enableStaff, listStaff, resendStaffInvite, setStaffName, setStaffRole } from "@/lib/aws/cognito";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), role: z.enum(["owner", "staff", "viewer"]) }),
  z.object({ action: z.literal("disable") }),
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("name"), name: z.string().trim().min(1).max(80) }),
  z.object({ action: z.literal("resend") }),
]);

const USERNAME = /^[\w.@+-]{1,128}$/;

async function findStaff(username: string) {
  if (!USERNAME.test(username)) throw new HttpError(404, "not_found");
  const target = (await listStaff()).find((s) => s.username === username);
  if (!target) throw new HttpError(404, "not_found");
  return target;
}

async function guardTarget(username: string, actorUsername: string, change: "demote" | "disable" | "delete") {
  if (!USERNAME.test(username)) throw new HttpError(404, "not_found");
  if (username === actorUsername) throw new HttpError(400, "cannot_change_self");
  const all = await listStaff();
  const target = all.find((s) => s.username === username);
  if (!target) throw new HttpError(404, "not_found");
  // Never leave the store without an active owner.
  const owners = all.filter((s) => s.role === "owner" && s.enabled);
  if (target.role === "owner" && owners.length <= 1) throw new HttpError(400, `last_owner_${change}`);
  return target;
}

export const PATCH = withAdmin<{ username: string }>("staff:manage", async (req, staff, { username: raw }) => {
  const username = decodeURIComponent(raw);
  const b = await parseBody(req, Body);
  if (b.action === "role") {
    const target = await guardTarget(username, staff.user.username, "demote");
    if (target.role !== b.role) await setStaffRole(username, b.role);
  } else if (b.action === "disable") {
    await guardTarget(username, staff.user.username, "disable");
    await disableStaff(username);
  } else if (b.action === "name") {
    // Anyone with staff:manage may correct a name, their own included.
    await findStaff(username);
    await setStaffName(username, b.name);
  } else if (b.action === "resend") {
    const target = await findStaff(username);
    if (target.status !== "FORCE_CHANGE_PASSWORD") throw new HttpError(400, "already_signed_in");
    await resendStaffInvite(target.email);
  } else {
    if (!USERNAME.test(username)) throw new HttpError(404, "not_found");
    await enableStaff(username);
  }
  await audit(staff.actor, `staff.${b.action}`, username, b.action === "role" ? { role: b.role } : b.action === "name" ? { name: b.name } : undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

export const DELETE = withAdmin<{ username: string }>("staff:manage", async (_req, staff, { username: raw }) => {
  const username = decodeURIComponent(raw);
  await guardTarget(username, staff.user.username, "delete");
  await deleteStaff(username);
  await audit(staff.actor, "staff.delete", username, undefined, staff.ip);
  return NextResponse.json({ ok: true });
});

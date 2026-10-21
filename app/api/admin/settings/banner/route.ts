import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseBody } from "@/lib/admin/guard";
import { audit } from "@/lib/data/audit";
import { saveBannerSettings } from "@/lib/data/settings";

export const runtime = "nodejs";

/** Links may point at a page on this site or an https URL; nothing else (no javascript: etc). */
const LinkHref = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || (/^\/(?!\/)[\w\-./?=&#%]*$/.test(v)) || /^https:\/\/[^\s]+$/.test(v), "invalid link");

const Body = z
  .object({
    enabled: z.boolean(),
    text: z.string().trim().max(140),
    linkHref: LinkHref.optional(),
    linkLabel: z.string().trim().max(40).optional(),
    startsAt: z.string().datetime().optional().or(z.literal("")),
    endsAt: z.string().datetime().optional().or(z.literal("")),
  })
  .refine((b) => !b.enabled || b.text.length > 0, "text required when enabled")
  .refine((b) => !b.startsAt || !b.endsAt || new Date(b.startsAt) < new Date(b.endsAt), "end must be after start");

export const PUT = withAdmin("banner:write", async (req, staff) => {
  const b = await parseBody(req, Body);
  await saveBannerSettings(
    {
      enabled: b.enabled,
      text: b.text,
      ...(b.linkHref ? { linkHref: b.linkHref } : {}),
      ...(b.linkLabel ? { linkLabel: b.linkLabel } : {}),
      ...(b.startsAt ? { startsAt: b.startsAt } : {}),
      ...(b.endsAt ? { endsAt: b.endsAt } : {}),
    },
    staff.user.email,
  );
  await audit(staff.actor, "settings.banner", undefined, { enabled: b.enabled }, staff.ip);
  return NextResponse.json({ ok: true });
});

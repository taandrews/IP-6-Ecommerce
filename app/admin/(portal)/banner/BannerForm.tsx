"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import type { BannerSettings } from "@/types/records";

function toLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function BannerForm({ initial }: { initial: BannerSettings }) {
  const router = useRouter();
  const [v, setV] = useState({
    enabled: initial.enabled,
    text: initial.text,
    linkHref: initial.linkHref ?? "",
    linkLabel: initial.linkLabel ?? "",
    startsAt: toLocal(initial.startsAt),
    endsAt: toLocal(initial.endsAt),
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await adminRequest("/api/admin/settings/banner", "PUT", {
        enabled: v.enabled,
        text: v.text,
        linkHref: v.linkHref || undefined,
        linkLabel: v.linkLabel || undefined,
        startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : "",
        endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : "",
      });
      setMsg({ ok: true, text: "Saved. It appears on the site within a few minutes." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-sm max-w-2xl">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} />
        <span className="font-medium">Show the banner</span>
      </label>
      <label className="block">
        <span className="label">Text ({v.text.length}/140)</span>
        <input className="input" maxLength={140} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} />
      </label>
      <p className="text-xs text-ink/60">Only state facts you can back up: offers, dates, shipping. No health claims.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Link (optional)</span>
          <input className="input" placeholder="/shop or https://…" maxLength={300} value={v.linkHref} onChange={(e) => setV({ ...v, linkHref: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Link text</span>
          <input className="input" maxLength={40} value={v.linkLabel} onChange={(e) => setV({ ...v, linkLabel: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Start showing (optional)</span>
          <input className="input" type="datetime-local" value={v.startsAt} onChange={(e) => setV({ ...v, startsAt: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Stop showing (optional)</span>
          <input className="input" type="datetime-local" value={v.endsAt} onChange={(e) => setV({ ...v, endsAt: e.target.value })} />
        </label>
      </div>
      {v.text ? (
        <div>
          <p className="label">Preview</p>
          <div className="bg-navy-800 text-surface text-center text-sm px-4 py-2 rounded">
            {v.text} {v.linkHref && v.linkLabel ? <span className="underline font-semibold">{v.linkLabel}</span> : null}
          </div>
        </div>
      ) : null}
      {msg ? <p role="status" className={msg.ok ? "text-emerald-700" : "text-danger"}>{msg.text}</p> : null}
      <button className="btn-primary text-sm" disabled={busy}>Save</button>
    </form>
  );
}

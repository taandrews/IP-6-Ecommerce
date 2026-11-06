"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pause, PlayCircle, SkipForward, XCircle, CreditCard } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Currency } from "@/types";

interface Sub {
  subscriptionId: string;
  productName: string;
  status: "active" | "trialing" | "paused" | "past_due" | "cancelled" | "incomplete";
  cycleDays: number;
  priceCents: number;
  currency: Currency;
  nextChargeDate?: string;
}

const STATUS_LABEL: Record<Sub["status"], string> = {
  active: "Active",
  trialing: "Active",
  paused: "Paused",
  past_due: "Payment due",
  cancelled: "Cancelled",
  incomplete: "Incomplete",
};

export function SubscriptionList() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/subscriptions", { cache: "no-store" });
    if (res.ok) setSubs(((await res.json()) as { subscriptions: Sub[] }).subscriptions ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function action(id: string, op: "pause" | "resume" | "skip" | "cancel") {
    if (op === "cancel" && !window.confirm("Cancel this subscription? You won't be charged again.")) return;
    setBusy(id + op);
    setMessage(null);
    try {
      const res = await fetch(`/api/subscriptions/${encodeURIComponent(id)}/${op}`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "We couldn't update your subscription.");
      setMessage({ ok: true, text: op === "cancel" ? "Subscription cancelled." : op === "skip" ? "Next delivery skipped." : op === "pause" ? "Subscription paused." : "Subscription resumed." });
      await load();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-ink/70">Loading your subscriptions…</p>;

  if (subs.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-ink/70">You don't have any subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p role="status" className={message.ok ? "text-sm text-forest-700" : "text-sm text-danger"}>{message.text}</p> : null}
      <ul className="grid gap-4">
        {subs.map((s) => {
          const live = s.status !== "cancelled";
          return (
            <li key={s.subscriptionId} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-forest-800">{s.productName}</p>
                  <p className="text-sm text-ink/70 mt-1 flex items-center gap-2">
                    <CalendarClock className="size-4" />
                    Every {s.cycleDays} days
                    {live && s.status !== "paused" && s.nextChargeDate ? ` · next charge ${formatDate(s.nextChargeDate)}` : ""}
                  </p>
                  <p className="text-sm mt-2">{formatPrice(s.priceCents, s.currency)} per delivery, plus shipping</p>
                </div>
                <span className={`badge ${s.status === "active" || s.status === "trialing" ? "badge-forest" : "badge-gold"}`}>{STATUS_LABEL[s.status]}</span>
              </div>
              {live ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.status !== "paused" ? (
                    <>
                      <button disabled={!!busy} onClick={() => action(s.subscriptionId, "skip")} className="btn-ghost text-sm">
                        <SkipForward className="size-4" /> Skip next
                      </button>
                      <button disabled={!!busy} onClick={() => action(s.subscriptionId, "pause")} className="btn-ghost text-sm">
                        <Pause className="size-4" /> Pause
                      </button>
                    </>
                  ) : (
                    <button disabled={!!busy} onClick={() => action(s.subscriptionId, "resume")} className="btn-ghost text-sm">
                      <PlayCircle className="size-4" /> Resume
                    </button>
                  )}
                  <button disabled={!!busy} onClick={() => action(s.subscriptionId, "cancel")} className="btn-ghost text-sm text-danger">
                    <XCircle className="size-4" /> Cancel
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <form action="/api/stripe/portal" method="post">
        <button type="submit" className="btn-secondary text-sm">
          <CreditCard className="size-4" /> Update payment card
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pause, PlayCircle, SkipForward, XCircle } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Subscription } from "@/types";

export function SubscriptionList() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setSubs(data.subscriptions ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function action(id: string, op: "pause" | "resume" | "skip" | "cancel") {
    await fetch(`/api/subscriptions/${id}/${op}`, { method: "POST" });
    // Re-fetch
    const res = await fetch("/api/subscriptions");
    if (res.ok) setSubs((await res.json()).subscriptions ?? []);
  }

  if (loading) return <p className="text-ink/70">Loading your subscriptions…</p>;

  if (subs.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-ink/70">You don't have any active subscriptions.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {subs.map((s) => (
        <li key={s.subscriptionId} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xl text-forest-800">{s.sku}</p>
              <p className="text-sm text-ink/70 mt-1 flex items-center gap-2">
                <CalendarClock className="size-4" />
                Every {s.cycleDays} days · next charge {formatDate(s.nextChargeDate)}
              </p>
              <p className="text-sm mt-2">{formatPrice(s.priceCents, s.currency)}</p>
            </div>
            <span
              className={`badge ${s.status === "active" ? "badge-forest" : "badge-gold"} capitalize`}
            >
              {s.status}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => action(s.subscriptionId, "skip")}
              className="btn-ghost text-sm"
            >
              <SkipForward className="size-4" /> Skip next
            </button>
            {s.status === "active" ? (
              <button
                onClick={() => action(s.subscriptionId, "pause")}
                className="btn-ghost text-sm"
              >
                <Pause className="size-4" /> Pause
              </button>
            ) : (
              <button
                onClick={() => action(s.subscriptionId, "resume")}
                className="btn-ghost text-sm"
              >
                <PlayCircle className="size-4" /> Resume
              </button>
            )}
            <button
              onClick={() => action(s.subscriptionId, "cancel")}
              className="btn-ghost text-sm text-danger"
            >
              <XCircle className="size-4" /> Cancel
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import type { SubscriptionStatus } from "@/types/records";

export function SubscriptionRowActions({ id, status }: { id: string; status: SubscriptionStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function op(o: "pause" | "resume" | "skip" | "cancel") {
    if (o === "cancel" && !window.confirm("Cancel this subscription? The customer won't be charged again.")) return;
    setBusy(true);
    setError(null);
    try {
      await adminRequest(`/api/admin/subscriptions/${encodeURIComponent(id)}`, "POST", { op: o });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === "paused" ? (
        <button className="btn-ghost text-xs" disabled={busy} onClick={() => op("resume")}>Resume</button>
      ) : (
        <>
          <button className="btn-ghost text-xs" disabled={busy} onClick={() => op("skip")}>Skip next</button>
          <button className="btn-ghost text-xs" disabled={busy} onClick={() => op("pause")}>Pause</button>
        </>
      )}
      <button className="btn-ghost text-xs text-danger" disabled={busy} onClick={() => op("cancel")}>Cancel</button>
      {error ? <span className="w-full text-right text-xs text-danger">{error}</span> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import type { ReviewStatus } from "@/types/records";

export function ReviewActions({ sku, reviewId, status }: { sku: string; reviewId: string; status: ReviewStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Why is this rejected? (internal)") ?? undefined;
      if (reason === undefined) return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminRequest("/api/admin/reviews", "POST", { sku, reviewId, action, reason: reason || undefined });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" ? <button className="btn-primary text-sm" disabled={busy} onClick={() => act("approve")}>Approve and publish</button> : null}
      {status !== "rejected" ? <button className="btn-ghost text-sm text-danger" disabled={busy} onClick={() => act("reject")}>{status === "published" ? "Unpublish" : "Reject"}</button> : null}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";

export function PrivacyRequestActions({ requestId, type }: { requestId: string; type: "delete" | "export" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close(action: "export_sent" | "reject") {
    const resolution = window.prompt(action === "reject" ? "Reason for rejecting (this is recorded):" : "How was the copy sent? (recorded)");
    if (!resolution || resolution.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await adminRequest(`/api/admin/privacy/${encodeURIComponent(requestId)}`, "POST", { action, resolution: resolution.trim() });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {type === "export" ? (
        <button className="btn-ghost text-sm" disabled={busy} onClick={() => close("export_sent")}>Mark sent</button>
      ) : null}
      <button className="btn-ghost text-sm text-danger" disabled={busy} onClick={() => close("reject")}>Reject</button>
      {error ? <p className="w-full text-right text-xs text-danger">{error}</p> : null}
    </div>
  );
}

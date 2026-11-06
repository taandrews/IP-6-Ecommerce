"use client";

import { useState } from "react";

export function StopReminders({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function stop() {
    setState("busy");
    const res = await fetch("/api/cart-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }
  if (state === "done") return <p className="text-ink/80" role="status">Done. We won&apos;t send you cart reminders again.</p>;
  return (
    <>
      <p className="text-ink/80 mb-6">Stop cart reminder emails to <strong>{email}</strong>? Order confirmations and shipping updates still come as usual.</p>
      <button type="button" className="btn-primary" onClick={stop} disabled={state === "busy"}>
        Stop cart reminders
      </button>
      {state === "error" ? <p className="mt-4 text-danger text-sm" role="alert">That didn&apos;t work. Please try again.</p> : null}
    </>
  );
}

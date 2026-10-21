"use client";

import { useState } from "react";
import { Download, MailX, Trash2 } from "lucide-react";

export function PrivacyControls({ verified }: { verified: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState("");

  async function act(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMsg({ ok: true, text: success });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {msg ? <p role="status" className={msg.ok ? "text-sm text-forest-700" : "text-sm text-danger"}>{msg.text}</p> : null}

      <section className="card p-6">
        <h3 className="font-medium text-forest-800 mb-1 flex items-center gap-2"><Download className="size-4" /> Download your data</h3>
        <p className="text-sm text-ink/70 mb-4">A JSON file with your account details, orders, subscriptions, reviews and email preferences.</p>
        {verified ? (
          <a href="/api/account/export" className="btn-secondary text-sm">Download</a>
        ) : (
          <p className="text-sm text-ink/60">Verify your email address to download your data.</p>
        )}
      </section>

      <section className="card p-6">
        <h3 className="font-medium text-forest-800 mb-1 flex items-center gap-2"><MailX className="size-4" /> Marketing emails</h3>
        <p className="text-sm text-ink/70 mb-4">Stop pre-order offers and updates. Order and account emails still arrive.</p>
        <button className="btn-secondary text-sm" disabled={busy} onClick={() => act({ action: "unsubscribe" }, "You're unsubscribed from marketing emails.")}>
          Unsubscribe
        </button>
      </section>

      <section className="card p-6">
        <h3 className="font-medium text-forest-800 mb-1 flex items-center gap-2"><Trash2 className="size-4" /> Delete your account</h3>
        <p className="text-sm text-ink/70 mb-3">
          We cancel any subscriptions, delete your login and remove your name, email, phone and address from past orders. Order amounts are kept
          for tax records without anything that identifies you. We complete requests within 30 days and email you when it's done.
        </p>
        <label htmlFor="del-details" className="label">Anything we should know (optional)</label>
        <textarea id="del-details" className="input min-h-[80px] mb-3" maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
        <button
          className="btn-ghost text-sm text-danger"
          disabled={busy || !verified}
          onClick={() => {
            if (window.confirm("Request deletion of your account and personal data? This can't be undone once completed.")) {
              void act({ action: "delete", details: details || undefined }, "Request received. We'll email you when it's complete.");
            }
          }}
        >
          Request deletion
        </button>
        {!verified ? <p className="text-sm text-ink/60 mt-2">Verify your email first, or use the form on our Privacy Policy page.</p> : null}
      </section>
    </div>
  );
}

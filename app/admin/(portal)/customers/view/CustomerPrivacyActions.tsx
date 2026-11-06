"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminDownload, adminRequest } from "@/components/admin/client";
import { Panel } from "@/components/admin/ui";

export function CustomerPrivacyActions({ k, canExport, canErase, requestId }: { k: string; canExport: boolean; canErase: boolean; requestId?: string }) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <Panel title="Privacy">
      <div className="space-y-6 text-sm">
        {msg ? <p role="status" className={msg.ok ? "text-emerald-700" : "text-danger"}>{msg.text}</p> : null}
        {canExport ? (
          <div>
            <p className="mb-2">Download everything held about this customer (for an access or portability request). Store it securely and delete it once sent.</p>
            <button
              className="btn-secondary text-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  await adminDownload("/api/admin/customers/export", { k }, "customer-data.json");
                } catch (err) {
                  setMsg({ ok: false, text: (err as Error).message });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Download data copy
            </button>
          </div>
        ) : null}
        {canErase ? (
          <form
            className="space-y-2 border-t border-cloud-300 pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!window.confirm("Erase this customer now? This cancels subscriptions, deletes the login and strips personal data from orders. It cannot be undone.")) return;
              setBusy(true);
              setMsg(null);
              try {
                await adminRequest("/api/admin/customers/erase", "POST", { k, confirmEmail, requestId, notify });
                setMsg({ ok: true, text: "Customer erased." });
                router.push(requestId ? "/admin/privacy" : "/admin/customers");
              } catch (err) {
                setMsg({ ok: false, text: (err as Error).message });
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="font-medium text-danger">Erase customer (right to erasure)</p>
            <p className="text-ink/70">Order amounts stay for tax records without name, email, phone or address. Only do this for a verified request.</p>
            <label className="block">
              <span className="label">Type the customer's email to confirm</span>
              <input className="input" type="email" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} autoComplete="off" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the customer when done
            </label>
            <button className="btn-ghost text-sm text-danger" disabled={busy || !confirmEmail}>Erase</button>
          </form>
        ) : null}
      </div>
    </Panel>
  );
}

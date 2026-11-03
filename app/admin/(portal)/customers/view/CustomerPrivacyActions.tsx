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
            <p className="mb-2">Download what this site holds (newsletter and waitlist sign-ups) for an access or portability request. Export the Shopify record from Shopify too (the customer's page, Export customer data). Store both securely and delete them once sent.</p>
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
              if (!window.confirm("Erase this customer now? This deletes their newsletter and waitlist sign-ups here and sends Shopify an erasure request for their account, orders and subscriptions. It cannot be undone.")) return;
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
            <p className="text-ink/70">Shopify completes its part on its own schedule and keeps order records it must hold by law. Cancel any active subscription in Shopify first. Only do this for a verified request.</p>
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

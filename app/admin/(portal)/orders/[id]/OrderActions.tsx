"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Panel } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";
import type { OrderStatus } from "@/types/records";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL Express", "Other"];

export function OrderActions(props: {
  orderId: string;
  status: OrderStatus;
  currency: Currency;
  refundableCents: number;
  canFulfil: boolean;
  canRefund: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [carrier, setCarrier] = useState("USPS");
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [restock, setRestock] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const url = `/api/admin/orders/${encodeURIComponent(props.orderId)}`;
  const open = props.status === "paid" || props.status === "processing";
  const refundable = ["paid", "processing", "shipped", "delivered", "partially_refunded"].includes(props.status) && props.refundableCents > 0;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (!props.canFulfil && !props.canRefund) return null;

  return (
    <Panel title="Actions">
      <div className="space-y-6 text-sm">
        {msg ? <p role="status" className={msg.ok ? "text-emerald-700" : "text-danger"}>{msg.text}</p> : null}

        {props.canFulfil && props.status === "paid" ? (
          <button className="btn-secondary text-sm w-full" disabled={busy} onClick={() => run(() => adminRequest(url, "POST", { action: "processing" }), "Marked as preparing.")}>
            Mark as preparing
          </button>
        ) : null}

        {props.canFulfil && open ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                () => adminRequest(url, "POST", { action: "fulfill", carrier, trackingNumber: tracking, trackingUrl, notify }),
                notify ? "Marked shipped and the customer was emailed." : "Marked shipped.",
              );
            }}
          >
            <p className="font-medium text-navy-800">Ship this order</p>
            <label className="block">
              <span className="label">Carrier</span>
              <select className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                {CARRIERS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Tracking number</span>
              <input className="input" required minLength={4} maxLength={60} pattern="[A-Za-z0-9 \-]+" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Tracking link (optional)</span>
              <input className="input" type="url" maxLength={500} placeholder="https://" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the customer the tracking details
            </label>
            <button className="btn-primary text-sm w-full" disabled={busy}>Mark shipped</button>
          </form>
        ) : null}

        {props.canFulfil && props.status === "shipped" ? (
          <button className="btn-secondary text-sm w-full" disabled={busy} onClick={() => run(() => adminRequest(url, "POST", { action: "deliver" }), "Marked delivered.")}>
            Mark delivered
          </button>
        ) : null}

        {props.canFulfil ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await adminRequest(url, "POST", { action: "note", text: note });
                setNote("");
              }, "Note added.");
            }}
          >
            <label className="block">
              <span className="label">Internal note (staff only)</span>
              <textarea className="input min-h-[70px]" maxLength={1000} required value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <p className="text-xs text-ink/55">Don't put payment or health details in notes.</p>
            <button className="btn-ghost text-sm" disabled={busy || !note.trim()}>Add note</button>
          </form>
        ) : null}

        {props.canRefund && refundable ? (
          <form
            className="space-y-2 border-t border-cloud-300 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = refundAmount.trim() ? Math.round(Number(refundAmount) * 100) : undefined;
              if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
                setMsg({ ok: false, text: "Enter a valid amount, or leave it empty for a full refund." });
                return;
              }
              const label = formatPrice(amount ?? props.refundableCents, props.currency);
              if (!window.confirm(`Refund ${label} to the customer's card? This can't be undone.`)) return;
              void run(
                () => adminRequest(`${url}/refund`, "POST", { amountCents: amount, reason: refundReason || undefined, restock, requestKey: crypto.randomUUID() }),
                `Refunded ${label}.`,
              );
            }}
          >
            <p className="font-medium text-navy-800">Refund</p>
            <p className="text-xs text-ink/60">Up to {formatPrice(props.refundableCents, props.currency)} remains refundable.</p>
            <label className="block">
              <span className="label">Amount ({props.currency}, leave empty for the full remaining amount)</span>
              <input className="input" inputMode="decimal" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Reason (internal)</span>
              <input className="input" maxLength={300} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Put items back in stock (full refunds only)
            </label>
            <button className="btn-secondary text-sm w-full text-danger" disabled={busy}>Refund</button>
          </form>
        ) : null}

        {props.canRefund && open ? (
          <form
            className="space-y-2 border-t border-cloud-300 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!window.confirm("Cancel this order and refund it in full?")) return;
              void run(() => adminRequest(url, "POST", { action: "cancel", reason: cancelReason, requestKey: crypto.randomUUID() }), "Order cancelled and refunded.");
            }}
          >
            <p className="font-medium text-navy-800">Cancel order</p>
            <label className="block">
              <span className="label">Reason</span>
              <input className="input" required minLength={3} maxLength={300} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </label>
            <button className="btn-ghost text-sm text-danger" disabled={busy}>Cancel and refund</button>
          </form>
        ) : null}
      </div>
    </Panel>
  );
}

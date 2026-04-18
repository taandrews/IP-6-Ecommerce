"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function ConfirmationStep({ email, orderId }: { email: string; orderId: string | null }) {
  return (
    <div className="card p-8 lg:p-10 text-center max-w-xl mx-auto">
      <div className="mx-auto size-14 rounded-full bg-forest-50 text-forest-700 grid place-items-center mb-5">
        <CheckCircle2 className="size-7" />
      </div>
      <h2 className="font-display text-display-md text-forest-800 mb-3">Order received.</h2>
      <p className="text-ink/80 mb-2">
        Thank you. A confirmation is on its way to{" "}
        <strong className="text-forest-800">{email}</strong>.
      </p>
      {orderId ? (
        <p className="text-sm text-ink/60 mb-6">
          Order reference: <code className="bg-ivory-200 px-1.5 py-0.5 rounded">{orderId}</code>
        </p>
      ) : null}
      <div className="mt-6 rounded-md border border-ivory-300 bg-ivory-200 p-4 text-sm text-ink/80 text-left">
        <p className="font-medium text-forest-800 mb-1">Don't have an account yet?</p>
        <p className="mb-3">Create one to track your order and manage any subscriptions.</p>
        <Link href={`/account/register?email=${encodeURIComponent(email)}`} className="btn-secondary">
          Create account
        </Link>
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/shop" className="btn-ghost">Continue shopping</Link>
      </div>
    </div>
  );
}

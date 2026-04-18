import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = { title: "Payment methods", robots: { index: false, follow: false } };

export default function PaymentMethodsPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-2">Payment methods</p>
        <h2 className="font-display text-display-md text-forest-800">Saved cards</h2>
      </header>
      <div className="card p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs text-ink/60">
          <Lock className="size-3.5" /> Stored securely by Stripe — never on our servers.
        </div>
        <p className="text-ink/70">
          You don't have any saved payment methods. Add one at checkout or through Stripe's hosted customer portal.
        </p>
        <form action="/api/stripe/portal" method="post">
          <button type="submit" className="btn-primary">Open billing portal</button>
        </form>
      </div>
    </div>
  );
}

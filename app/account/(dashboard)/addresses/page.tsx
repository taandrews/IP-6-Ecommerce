import type { Metadata } from "next";

export const metadata: Metadata = { title: "Addresses", robots: { index: false, follow: false } };

export default function AddressesPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-2">Addresses</p>
        <h2 className="font-display text-display-md text-forest-800">Saved addresses</h2>
      </header>
      <div className="card p-8 text-center">
        <p className="text-ink/70 mb-4">We don't keep a separate address book.</p>
        <p className="text-sm text-ink/60">Each order keeps the shipping address you enter at checkout, and you can see it on the order. Subscription renewals ship to the address given when you subscribed; to change it, contact us.</p>
      </div>
    </div>
  );
}

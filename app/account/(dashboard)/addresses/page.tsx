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
        <p className="text-ink/70 mb-4">You haven't saved any addresses yet.</p>
        <p className="text-sm text-ink/60">Your shipping address will be saved automatically on your next order.</p>
      </div>
    </div>
  );
}

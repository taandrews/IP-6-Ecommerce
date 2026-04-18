import type { Metadata } from "next";
import { SubscriptionList } from "./SubscriptionList";

export const metadata: Metadata = {
  title: "Subscriptions",
  robots: { index: false, follow: false },
};

export default function SubscriptionsPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-2">Subscriptions</p>
        <h2 className="font-display text-display-md text-forest-800">Manage your deliveries</h2>
        <p className="text-ink/70 mt-2">
          Change frequency, skip the next order, pause, or cancel at any time.
        </p>
      </header>
      <SubscriptionList />
    </div>
  );
}

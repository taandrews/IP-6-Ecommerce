import type { Metadata } from "next";
import Link from "next/link";
import { Package, RefreshCw, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Account dashboard",
  robots: { index: false, follow: false },
};

export default function AccountDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2">Dashboard</p>
        <h2 className="font-display text-display-md text-forest-800">Welcome back.</h2>
        <p className="text-ink/70 mt-2">
          Manage your orders, subscriptions, addresses, and payment methods.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          icon={Package}
          title="Orders"
          body="Track shipments and view past orders."
          href="/account/orders"
        />
        <Card
          icon={RefreshCw}
          title="Subscriptions"
          body="Skip, pause, or modify your deliveries."
          href="/account/subscriptions"
        />
        <Card
          icon={MapPin}
          title="Addresses"
          body="Update shipping and billing addresses."
          href="/account/addresses"
        />
      </div>

      <section className="card p-6">
        <h3 className="font-display text-lg text-forest-800 mb-3">Need help?</h3>
        <p className="text-sm text-ink/75 mb-3">
          Our team responds within one business day. Email <a href="mailto:support@ip6original.com" className="underline text-forest-700">support@ip6original.com</a> or visit the <Link href="/faq" className="underline text-forest-700">FAQ</Link>.
        </p>
      </section>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card p-5 hover:border-forest-300 transition-colors"
    >
      <Icon className="size-5 text-forest-600 mb-3" />
      <h3 className="font-display text-lg text-forest-800 mb-1">{title}</h3>
      <p className="text-sm text-ink/70">{body}</p>
    </Link>
  );
}

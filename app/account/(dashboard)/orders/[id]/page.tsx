import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // Real fetch: DynamoDB Orders.get(orderId) scoped to the auth'd user.
  return (
    <div>
      <Link href="/account/orders" className="text-sm text-ink/70 hover:text-forest-700">
        ← All orders
      </Link>
      <h2 className="font-display text-display-md text-forest-800 mt-4 mb-6">
        Order {params.id}
      </h2>
      <div className="card p-6">
        <p className="text-ink/70">
          Order details are available once your account is connected. For immediate help with this
          order, please contact{" "}
          <a href="mailto:support@ip6original.com" className="underline text-forest-700">
            support@ip6original.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

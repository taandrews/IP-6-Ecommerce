import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "./CheckoutFlow";
import { getSessionUser } from "@/lib/auth/session";
import { getStripeSecrets } from "@/lib/aws/secrets";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [user, { publishableKey }] = await Promise.all([getSessionUser(), getStripeSecrets()]);
  return (
    <div className="min-h-[80vh] bg-ivory-100">
      <Suspense>
        <CheckoutFlow signedIn={!!user} publishableKey={publishableKey} />
      </Suspense>
    </div>
  );
}

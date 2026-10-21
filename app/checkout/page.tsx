import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "./CheckoutFlow";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getSessionUser();
  return (
    <div className="min-h-[80vh] bg-ivory-100">
      <Suspense>
        <CheckoutFlow signedIn={!!user} />
      </Suspense>
    </div>
  );
}

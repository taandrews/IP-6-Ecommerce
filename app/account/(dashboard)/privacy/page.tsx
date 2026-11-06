import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PrivacyControls } from "./PrivacyControls";

export const metadata: Metadata = { title: "Privacy and data", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPrivacyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account/login?next=/account/privacy");
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2">Privacy</p>
        <h2 className="font-display text-display-md text-forest-800">Your data</h2>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Download a copy of the personal data we hold about you, stop marketing emails, or ask us to delete your account. See our{" "}
          <a href="/legal/privacy" className="underline text-forest-700">Privacy Policy</a> for details.
        </p>
      </header>
      <PrivacyControls verified={user.emailVerified} />
    </div>
  );
}

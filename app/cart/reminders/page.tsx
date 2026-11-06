import type { Metadata } from "next";
import { checkUnsubscribeToken } from "@/lib/cart-reminder";
import { StopReminders } from "./StopReminders";

export const metadata: Metadata = { title: "Cart reminders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Opt-out from the reminder email. Opening the link changes nothing (mail
 * scanners open links); the button confirms.
 */
export default async function RemindersPage(props: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e, t } = await props.searchParams;
  const email = typeof e === "string" && e.length <= 254 ? e : "";
  const valid = email ? await checkUnsubscribeToken(email, t) : false;
  return (
    <div className="container py-20 max-w-lg text-center">
      <h1 className="font-display text-display-md text-forest-800 mb-4">Cart reminders</h1>
      {valid ? (
        <StopReminders email={email} token={String(t)} />
      ) : (
        <p className="text-ink/70">This link has expired. Reply to any of our emails and we&apos;ll turn reminders off for you.</p>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Email confirmation", robots: { index: false, follow: false } };

const MESSAGES = {
  newsletter: { title: "You're on the list.", text: "Thanks for confirming. We'll email you IP6 Original news and launch offers. You can unsubscribe at any time." },
  waitlist: { title: "Launch alert confirmed.", text: "Thanks for confirming. We'll email you when IP6 Original ships to your country." },
  invalid: { title: "That link didn't work.", text: "It may have expired (links last 48 hours) or been used already. Sign up again and we'll send a new one." },
  error: { title: "Something went wrong.", text: "We couldn't confirm your email just now. Please try the link again in a few minutes." },
} as const;

/** Where the confirmation button in a sign-up email lands. */
export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ status?: string; list?: string }> }) {
  const { status, list } = await searchParams;
  const m = status === "ok" ? (list === "waitlist" ? MESSAGES.waitlist : MESSAGES.newsletter) : status === "error" ? MESSAGES.error : MESSAGES.invalid;
  return (
    <div className="container py-20 text-center" role="status">
      <h1 className="font-display text-display-lg text-forest-800 mb-4">{m.title}</h1>
      <p className="text-ink/70 mb-8 max-w-xl mx-auto">{m.text}</p>
      <Link href="/shop" className="btn-primary">Browse products</Link>
    </div>
  );
}

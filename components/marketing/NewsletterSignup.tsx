"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="border-b border-navy-600 pb-10 mb-10">
      <div className="md:grid md:grid-cols-[1fr_1.1fr] md:gap-10 md:items-center">
        <div className="mb-6 md:mb-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-500 font-bold mb-3">
            Launching soon
          </p>
          <h2
            className="font-serif text-surface text-balance"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Be first to get IP6 Original.
          </h2>
          <p className="mt-3 text-sm text-surface/65 leading-relaxed max-w-md">
            Join the waitlist for early access and a founder&rsquo;s launch
            discount, reserved for our first subscribers.
          </p>
        </div>

        {state === "done" ? (
          <div className="flex items-center gap-3 rounded-full bg-navy-600/50 px-6 py-4 text-surface">
            <Check className="size-5 text-gold-500 shrink-0" aria-hidden />
            <p className="text-sm font-medium">
              You&rsquo;re on the list. Watch your inbox for early access.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-full bg-surface/10 border border-surface/25 px-5 py-3.5 text-surface placeholder:text-surface/45 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-surface px-6 py-3.5 rounded-full font-semibold whitespace-nowrap"
            >
              {state === "loading" ? "Joining…" : "Join the waitlist"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}
        {state === "error" ? (
          <p className="mt-3 text-sm text-gold-500 md:col-start-2">
            Something went wrong — please try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}

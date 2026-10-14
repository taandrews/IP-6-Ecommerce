"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type State = "idle" | "sending" | "done" | "error";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
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

  if (state === "done") {
    return (
      <p className={dark ? "text-sm text-cream" : "text-sm text-navy-800"} role="status">
        Thanks. You are on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full" aria-label="Newsletter signup">
      <label htmlFor="footer-newsletter" className="sr-only">
        Email address
      </label>
      <div className={dark ? "flex items-center gap-2 border-b-2 border-cream/70 pb-2" : "flex items-center gap-2 border-b-2 border-navy-800 pb-2"}>
        <input
          id="footer-newsletter"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={dark ? "min-w-0 flex-1 bg-transparent py-2 text-base text-cream placeholder:text-cream/40 focus-visible:outline-none focus-visible:ring-0" : "min-w-0 flex-1 bg-transparent py-2 text-base text-navy-800 placeholder:text-navy-800/40 focus-visible:outline-none focus-visible:ring-0"}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className={dark ? "inline-flex shrink-0 items-center gap-1.5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400 hover:text-cream disabled:opacity-50" : "inline-flex shrink-0 items-center gap-1.5 py-2 text-sm font-semibold text-navy-800 hover:text-gold-700 disabled:opacity-50"}
        >
          Subscribe
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <p className={dark ? "mt-3 text-xs text-cream/55" : "mt-3 text-xs text-navy-800/55"}>
        {state === "error"
          ? "Something went wrong. Please try again."
          : "Occasional notes only. Unsubscribe any time."}
      </p>
    </form>
  );
}

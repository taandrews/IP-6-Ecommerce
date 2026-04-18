"use client";

import { useState } from "react";
import { Input, Textarea, Select } from "@/components/ui/Input";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-8">
        <h2 className="font-display text-xl text-forest-800 mb-2">Thank you.</h2>
        <p className="text-ink/80">
          We received your message and will respond within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 card p-8" aria-busy={status === "submitting"}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input id="name" name="name" label="Name" required autoComplete="name" />
        <Input id="email" name="email" type="email" label="Email" required autoComplete="email" />
      </div>
      <Select id="topic" name="topic" label="Topic" required>
        <option value="support">Customer support</option>
        <option value="order">Order question</option>
        <option value="wholesale">Wholesale inquiry</option>
        <option value="humanitarian">Humanitarian program</option>
        <option value="press">Press</option>
        <option value="other">Other</option>
      </Select>
      <Input id="order" name="order" label="Order number" hint="Optional — for order-specific questions." />
      <Textarea id="message" name="message" label="Message" required maxLength={2000} />
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

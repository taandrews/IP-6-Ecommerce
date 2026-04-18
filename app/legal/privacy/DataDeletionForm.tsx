"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";

export function DataDeletionForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/privacy/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-forest-700">
        Request received. You'll receive a confirmation email within 5 business days.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input id="del-email" name="email" type="email" label="Email on file" required />
      <Textarea
        id="del-details"
        name="details"
        label="Details (optional)"
        hint="Mention any specific data you want removed or retained for legal reasons (e.g., tax records)."
      />
      <button type="submit" className="btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit request"}
      </button>
      {status === "error" ? (
        <p className="text-sm text-danger" role="alert">
          Something went wrong. Please email privacy@ip6original.com.
        </p>
      ) : null}
    </form>
  );
}

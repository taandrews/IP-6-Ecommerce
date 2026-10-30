"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Honeypot } from "@/components/ui/Honeypot";
import { Captcha, captchaPayload } from "@/components/ui/Captcha";

export function DataDeletionForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [type, setType] = useState<"delete" | "export">("delete");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const el = e.currentTarget;
    const form = new FormData(el);
    try {
      const captcha = await captchaPayload(el);
      const res = await fetch("/api/privacy/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), details: form.get("details") ?? "", type, website: form.get("website") ?? "", captcha }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-forest-700" role="status">
        Check your inbox. If we hold data for that address, the email contains a link to confirm your request. The link works for 48 hours.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      <Honeypot />
      <fieldset className="space-y-2">
        <legend className="label">What would you like?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" checked={type === "delete"} onChange={() => setType("delete")} /> Delete my data
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" checked={type === "export"} onChange={() => setType("export")} /> Send me a copy of my data
        </label>
      </fieldset>
      <Input id="del-email" name="email" type="email" label="Email you used with us" required autoComplete="email" />
      <Textarea id="del-details" name="details" label="Details (optional)" hint="Anything that helps us find your data or understand your request." />
      <Captcha />
      <button type="submit" className="btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send confirmation link"}
      </button>
      {status === "error" ? (
        <p className="text-sm text-danger" role="alert">
          Something went wrong. Please try again or use the contact form.
        </p>
      ) : null}
    </form>
  );
}

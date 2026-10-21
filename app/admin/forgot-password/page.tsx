"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

export default function StaffForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const body =
        step === "request"
          ? { step: "request", email: String(form.get("email") ?? "") }
          : { step: "confirm", email, code: String(form.get("code") ?? "").trim(), newPassword: String(form.get("newPassword") ?? "") };
      const res = await fetch("/api/admin/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (step === "request") {
        setEmail(String(form.get("email") ?? ""));
        setStep("confirm");
      } else setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cloud-100 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-navy-800 mb-6">Reset staff password</h1>
        {step === "done" ? (
          <div className="rounded-lg border border-cloud-300 bg-surface p-8 space-y-4">
            <p className="text-sm text-ink/80">Your password is updated. Sign in with it and your authenticator code.</p>
            <Link href="/admin/login" className="btn-primary">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-lg border border-cloud-300 bg-surface p-8 space-y-5">
            {step === "request" ? (
              <>
                <p className="text-sm text-ink/75">If this email has a staff account, we'll send it a reset code.</p>
                <Input id="sf-email" name="email" type="email" label="Work email" required autoComplete="username" />
              </>
            ) : (
              <>
                <Input id="sf-code" name="code" label="Code from the email" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
                <Input id="sf-new" name="newPassword" type="password" label="New password" required minLength={12} autoComplete="new-password" hint="At least 12 characters with upper and lower case letters, a number and a symbol." />
              </>
            )}
            {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Please wait…" : step === "request" ? "Send code" : "Set new password"}</button>
            <Link href="/admin/login" className="block text-sm underline text-navy-800">Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (step === "email") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.get("email") }),
        });
        if (!res.ok) throw new Error("Could not start reset");
        setEmail(String(form.get("email") ?? ""));
        setStep("reset");
      } else {
        const res = await fetch("/api/auth/confirm-forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code: form.get("code"),
            newPassword: form.get("newPassword"),
          }),
        });
        if (!res.ok) throw new Error("Could not reset password");
        router.push("/account/login?reset=1");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "reset") {
    return (
      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <p className="text-sm text-ink/80">
          Enter the code we emailed to <strong>{email}</strong> and choose a new password.
        </p>
        <Input id="fp-code" name="code" label="Verification code" required inputMode="numeric" maxLength={6} />
        <Input
          id="fp-new"
          name="newPassword"
          type="password"
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8 space-y-5">
      <Input id="fp-email" name="email" type="email" label="Email" required autoComplete="email" />
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset code"}
      </button>
    </form>
  );
}

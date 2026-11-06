"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { safeNextPath } from "@/lib/auth/redirect";

type Step = "password" | "NEW_PASSWORD";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [step, setStep] = useState<Step>("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; next?: string; challenge?: string; error?: string; restart?: boolean };
    if (data.challenge === "NEW_PASSWORD") {
      setStep("NEW_PASSWORD");
      return;
    }
    if (!res.ok || !data.ok) {
      if (data.restart) setStep("password");
      throw new Error(data.error ?? "Sign in failed");
    }
    router.push(safeNextPath(data.next, next));
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (step === "password") {
        await post("/api/auth/signin", { email: form.get("email"), password: form.get("password"), next });
      } else {
        const pw = String(form.get("newPassword") ?? "");
        if (pw !== String(form.get("confirmPassword") ?? "")) throw new Error("The passwords don't match.");
        await post("/api/auth/challenge", { type: "NEW_PASSWORD", newPassword: pw });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-8 space-y-5">
      {step === "password" ? (
        <>
          <Input id="login-email" name="email" type="email" label="Email" required autoComplete="email" />
          <Input id="login-password" name="password" type="password" label="Password" required autoComplete="current-password" />
        </>
      ) : (
        <>
          <p className="text-sm text-ink/80">Please choose a new password to continue.</p>
          <Input
            id="login-new-password"
            name="newPassword"
            type="password"
            label="New password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters with upper and lower case letters, a number and a symbol."
          />
          <Input id="login-confirm-password" name="confirmPassword" type="password" label="Confirm new password" required minLength={8} autoComplete="new-password" />
        </>
      )}

      {error ? (
        <p className="text-sm text-danger rounded-md bg-red-50 border border-red-200 p-3" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <Link href="/account/forgot-password" className="text-sm text-forest-700 underline">
          Forgot your password?
        </Link>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Please wait…" : step === "password" ? "Sign in" : "Set password"}
      </button>
    </form>
  );
}

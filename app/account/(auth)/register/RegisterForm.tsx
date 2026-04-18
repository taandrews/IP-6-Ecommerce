"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilled = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [email, setEmail] = useState(prefilled);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (!awaitingCode) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
            name: form.get("name"),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sign up failed");
        setEmail(String(form.get("email") ?? ""));
        setAwaitingCode(true);
      } else {
        const res = await fetch("/api/auth/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: form.get("code") }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Confirmation failed");
        router.push("/account/login?confirmed=1");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (awaitingCode) {
    return (
      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <p className="text-sm text-ink/80">
          We emailed a 6-digit verification code to <strong>{email}</strong>.
        </p>
        <Input id="code" name="code" label="Verification code" required inputMode="numeric" maxLength={6} />
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8 space-y-5">
      <Input id="r-name" name="name" label="Full name" required autoComplete="name" />
      <Input
        id="r-email"
        name="email"
        type="email"
        label="Email"
        required
        defaultValue={prefilled}
        autoComplete="email"
      />
      <Input
        id="r-password"
        name="password"
        type="password"
        label="Password"
        required
        minLength={8}
        hint="Minimum 8 characters. Must include a number and special character."
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <p className="text-xs text-ink/60">
        By creating an account, you agree to our <a href="/legal/terms" className="underline">Terms</a> and{" "}
        <a href="/legal/privacy" className="underline">Privacy Policy</a>.
      </p>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

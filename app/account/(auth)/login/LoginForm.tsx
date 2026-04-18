"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-8 space-y-5">
      <Input
        id="login-email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
      />
      <Input
        id="login-password"
        name="password"
        type="password"
        label="Password"
        required
        autoComplete="current-password"
        minLength={8}
      />
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
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

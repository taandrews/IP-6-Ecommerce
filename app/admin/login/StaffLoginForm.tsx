"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { safeNextPath } from "@/lib/auth/redirect";

type Step = "password" | "NEW_PASSWORD" | "MFA_SETUP" | "MFA";

interface ApiReply {
  ok?: boolean;
  next?: string;
  challenge?: Step;
  error?: string;
  restart?: boolean;
  secret?: string;
  qr?: string;
}

export function StaffLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = safeNextPath(params.get("next"), "/admin");
  const next = nextParam.startsWith("/admin") ? nextParam : "/admin";
  const [step, setStep] = useState<Step>("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrol, setEnrol] = useState<{ secret: string; qr: string } | null>(null);

  async function post(url: string, body: Record<string, unknown>): Promise<ApiReply> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as ApiReply;
    if (!res.ok) {
      if (data.restart) {
        setStep("password");
        setEnrol(null);
      }
      throw new Error(data.error ?? "Sign in failed");
    }
    return data;
  }

  async function advance(data: ApiReply) {
    if (data.challenge) {
      setStep(data.challenge);
      if (data.challenge === "MFA_SETUP") {
        const e = await post("/api/admin/auth/challenge", { type: "MFA_SETUP_START" });
        if (e.secret && e.qr) setEnrol({ secret: e.secret, qr: e.qr });
      }
      return;
    }
    if (data.ok) {
      router.push(safeNextPath(data.next, next));
      router.refresh();
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (step === "password") {
        await advance(await post("/api/admin/auth/signin", { email: form.get("email"), password: form.get("password"), next }));
      } else if (step === "NEW_PASSWORD") {
        const pw = String(form.get("newPassword") ?? "");
        if (pw !== String(form.get("confirmPassword") ?? "")) throw new Error("The passwords don't match.");
        await advance(await post("/api/admin/auth/challenge", { type: "NEW_PASSWORD", newPassword: pw }));
      } else if (step === "MFA_SETUP") {
        await advance(await post("/api/admin/auth/challenge", { type: "MFA_SETUP_VERIFY", code: String(form.get("code") ?? "").replace(/\s/g, "") }));
      } else {
        await advance(await post("/api/admin/auth/challenge", { type: "MFA", code: String(form.get("code") ?? "").replace(/\s/g, "") }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-cloud-300 bg-surface p-8 space-y-5 shadow-sm">
      {step === "password" ? (
        <>
          <Input id="staff-email" name="email" type="email" label="Work email" required autoComplete="username" />
          <Input id="staff-password" name="password" type="password" label="Password" required autoComplete="current-password" />
        </>
      ) : null}

      {step === "NEW_PASSWORD" ? (
        <>
          <p className="text-sm text-ink/80">Welcome. Choose a password for your staff account.</p>
          <Input
            id="staff-new-password"
            name="newPassword"
            type="password"
            label="New password"
            required
            minLength={12}
            autoComplete="new-password"
            hint="At least 12 characters with upper and lower case letters, a number and a symbol."
          />
          <Input id="staff-confirm-password" name="confirmPassword" type="password" label="Confirm password" required minLength={12} autoComplete="new-password" />
        </>
      ) : null}

      {step === "MFA_SETUP" ? (
        <>
          <p className="text-sm text-ink/80">
            Staff accounts need an authenticator app (for example Google Authenticator, 1Password or Microsoft Authenticator). Scan this code, then
            enter the 6-digit code it shows.
          </p>
          {enrol ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrol.qr} alt="Authenticator setup QR code" width={220} height={220} />
              <p className="text-xs text-ink/60 text-center break-all">
                Or enter this key by hand: <code className="bg-cloud-100 px-1 py-0.5 rounded">{enrol.secret}</code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink/60">Preparing your setup code…</p>
          )}
          <Input id="staff-setup-code" name="code" label="6-digit code" required inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} autoComplete="one-time-code" />
        </>
      ) : null}

      {step === "MFA" ? (
        <>
          <p className="text-sm text-ink/80">Enter the 6-digit code from your authenticator app.</p>
          <Input id="staff-code" name="code" label="Authentication code" required inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} autoComplete="one-time-code" autoFocus />
        </>
      ) : null}

      {error ? (
        <p className="text-sm text-danger rounded-md bg-red-50 border border-red-200 p-3" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        {step === "password" ? (
          <Link href="/admin/forgot-password" className="text-sm text-navy-800 underline">Forgot password?</Link>
        ) : (
          <button type="button" className="text-sm text-navy-800 underline" onClick={() => { setStep("password"); setEnrol(null); setError(null); }}>
            Start over
          </button>
        )}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading || (step === "MFA_SETUP" && !enrol)}>
        {loading ? "Please wait…" : step === "password" ? "Sign in" : step === "NEW_PASSWORD" ? "Set password" : "Verify"}
      </button>
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <p className="eyebrow mb-2">Reset</p>
        <h1 className="font-display text-display-lg text-forest-800 mb-3">Forgot password?</h1>
        <p className="text-ink/70 text-sm">
          We'll email a code. Remembered it?{" "}
          <Link href="/account/login" className="underline text-forest-700">Sign in</Link>
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}

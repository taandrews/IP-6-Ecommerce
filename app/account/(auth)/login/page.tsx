import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <>
      <div className="mb-8">
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-display-lg text-forest-800 mb-3">Sign in</h1>
        <p className="text-ink/70 text-sm">
          New to IP-6 Research?{" "}
          <Link href="/account/register" className="underline text-forest-700">
            Create an account
          </Link>
        </p>
      </div>
      <LoginForm />
    </>
  );
}

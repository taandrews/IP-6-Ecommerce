import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8">
        <p className="eyebrow mb-2">Get started</p>
        <h1 className="font-display text-display-lg text-forest-800 mb-3">Create your account</h1>
        <p className="text-ink/70 text-sm">
          Already have one?{" "}
          <Link href="/account/login" className="underline text-forest-700">Sign in</Link>
        </p>
      </div>
      <RegisterForm />
    </>
  );
}

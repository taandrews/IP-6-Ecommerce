import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffLoginForm } from "./StaffLoginForm";

export const metadata: Metadata = { title: "Staff sign in · IP6 Original", robots: { index: false, follow: false } };

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-cloud-100 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink/55 font-semibold mb-2">IP6 Original</p>
        <h1 className="font-display text-3xl text-navy-800 mb-2">Staff sign in</h1>
        <p className="text-sm text-ink/65 mb-6">For the IP6 Original team. Customer accounts can't sign in here.</p>
        <Suspense>
          <StaffLoginForm />
        </Suspense>
      </div>
    </div>
  );
}

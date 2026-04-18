"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container py-24 text-center max-w-xl">
      <h1 className="font-display text-display-lg text-forest-800 mb-4">Something went wrong.</h1>
      <p className="text-ink/75 mb-8">
        We've logged the issue. Please try again or head back home.
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Home</Link>
      </div>
    </section>
  );
}

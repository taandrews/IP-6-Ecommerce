"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartStore";
import type { CartLine } from "@/types";

/** Puts the saved items back in the cart (replacing what's there) and opens checkout. */
export function RestoreCart({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const { clear, add } = useCart();
  useEffect(() => {
    if (!lines.length) return;
    clear();
    for (const line of lines) add(line, { openDrawer: false });
    router.replace("/checkout");
  }, [lines, clear, add, router]);

  if (lines.length) return <p className="container py-20 text-center text-ink/70">Restoring your cart…</p>;
  return (
    <div className="container py-20 text-center">
      <h1 className="font-display text-display-md text-forest-800 mb-4">Those items aren&apos;t available right now</h1>
      <Link href="/shop" className="btn-primary">Browse products</Link>
    </div>
  );
}

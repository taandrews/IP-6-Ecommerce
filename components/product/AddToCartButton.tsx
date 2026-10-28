"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { CartLine } from "@/types";
import { useCart } from "@/components/cart/CartStore";

/**
 * Adds a line to the cart without opening the drawer, so the visitor can keep
 * shopping. The button itself confirms the add for a moment; the header's cart
 * count updates at the same time.
 */
export function AddToCartButton({ line, disabled, className = "", children }: { line: () => CartLine; disabled?: boolean; className?: string; children?: React.ReactNode }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-live="polite"
      onClick={() => {
        add(line(), { openDrawer: false });
        setAdded(true);
      }}
      className={className}
    >
      {added ? (
        <>
          <Check size={16} aria-hidden="true" /> Added
        </>
      ) : (
        children ?? (
          <>
            <ShoppingBag size={16} aria-hidden="true" /> Add to cart
          </>
        )
      )}
    </button>
  );
}

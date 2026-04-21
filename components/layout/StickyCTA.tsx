"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent product CTA that appears after the hero is scrolled past.
 * Mounted on the home page and optionally others. Collapsible; dismiss
 * state persists for the session only.
 */
export function StickyCTA({
  label,
  sublabel,
  href,
  price,
}: {
  label: string;
  sublabel?: string;
  href: string;
  price?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-xl",
        "transition-all duration-400 ease-brand",
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none",
      )}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0) + 5rem)" }}
    >
      <div className="flex items-center gap-3 bg-forest-800 text-ivory-100 rounded-full shadow-card pl-5 pr-2 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {sublabel ? (
            <p className="text-[11px] text-ivory-100/65 truncate">{sublabel}</p>
          ) : null}
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 bg-gold-400 hover:bg-gold-500 text-forest-900 font-medium rounded-full px-4 py-2.5 text-sm whitespace-nowrap"
        >
          {price ? `Shop · ${price}` : "Shop"}
          <ArrowRight className="size-3.5" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="p-2 rounded-full hover:bg-forest-700/70"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

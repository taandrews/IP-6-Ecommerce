"use client";

import { useEffect, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { cn } from "@/lib/utils";

/**
 * Persistent DSHEA disclaimer bar (21 CFR 101.93) modeled after
 * pharmaceutical Important Safety Information bands. Sits fixed at the
 * bottom of the viewport; the user can dismiss it for the session. It
 * opens collapsed to a single line on every screen size and expands on
 * tap, so phones keep room for the price and purchase controls. The full
 * statement is also printed in the footer of every page that mounts this
 * bar, so the wording is never out of reach.
 *
 * Mount on pages that carry the supplement/skincare disclaimer.
 */
export function StickyDisclaimer() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    // Hide when the user has scrolled to within 200px of the document bottom
    // (their footer already shows the disclaimer there).
    function onScroll() {
      const near =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
      setAtFooter(near);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || atFooter) return null;

  return (
    <aside
      aria-label="FDA disclaimer"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-ivory-300 bg-surface/95 backdrop-blur",
        "transition-all duration-300 ease-brand",
      )}
    >
      <div className="container pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-start gap-x-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 flex items-start gap-x-3 text-left"
        >
          <span
            className="text-[10px] uppercase tracking-[0.28em] font-medium shrink-0 mt-1"
            style={{ color: "rgb(176 142 53)" }}
          >
            FDA Disclaimer
          </span>
          <span
            className={cn(
              "flex-1 min-w-0 text-xs sm:text-sm text-ink/80 leading-snug",
              expanded ? "" : "truncate",
            )}
          >
            {DSHEA_DISCLAIMER}
          </span>
          <ChevronUp aria-hidden className={cn("size-4 shrink-0 mt-0.5 text-ink/60 transition-transform", expanded && "rotate-180")} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss disclaimer for this session"
          className="-mt-1 p-1.5 hover:bg-ivory-200 rounded shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}

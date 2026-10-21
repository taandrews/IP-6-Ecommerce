"use client";

import { useEffect, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { cn } from "@/lib/utils";

/**
 * Persistent DSHEA disclaimer bar (21 CFR 101.93) modeled after
 * pharmaceutical Important Safety Information bands. Sits fixed at the
 * bottom of the viewport; the user can dismiss it for the session. On
 * desktop it collapses to two lines with an expand control. On phones the
 * whole statement always shows (it is legally required wording, so it is
 * never cut off), and the bottom padding clears the iPhone home indicator.
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
      <div className="container pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex flex-wrap sm:flex-nowrap items-start gap-x-3 gap-y-1">
        <span
          className="order-1 text-[10px] uppercase tracking-[0.28em] font-medium shrink-0 mt-1"
          style={{ color: "rgb(176 142 53)" }}
        >
          FDA Disclaimer
        </span>
        <p
          className={cn(
            "order-3 sm:order-2 w-full sm:w-auto sm:flex-1 text-xs sm:text-sm text-ink/80 leading-snug",
            expanded ? "" : "sm:line-clamp-2",
          )}
        >
          {DSHEA_DISCLAIMER}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse disclaimer" : "Expand disclaimer"}
          className="order-2 sm:order-3 p-1.5 hover:bg-ivory-200 rounded shrink-0 hidden sm:inline-flex"
        >
          <ChevronUp className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss disclaimer for this session"
          className="order-2 sm:order-4 ml-auto sm:ml-0 -mt-1 sm:mt-0 p-1.5 hover:bg-ivory-200 rounded shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}

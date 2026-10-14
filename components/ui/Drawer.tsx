"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  children,
  title,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  side?: "right" | "left";
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 h-full w-full max-w-md bg-surface shadow-card transition-transform duration-300 ease-brand flex flex-col",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-ivory-300 px-6 py-4">
          <h2 className="font-display text-xl text-forest-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-md hover:bg-ivory-200"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

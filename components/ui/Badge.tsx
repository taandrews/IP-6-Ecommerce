import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "forest",
  className,
}: {
  children: ReactNode;
  variant?: "forest" | "gold" | "neutral" | "danger";
  className?: string;
}) {
  const variants = {
    forest: "bg-forest-50 text-forest-800 ring-1 ring-forest-200",
    gold: "bg-gold-100 text-forest-900 ring-1 ring-gold-300",
    neutral: "bg-ivory-200 text-ink ring-1 ring-ivory-300",
    danger: "bg-red-50 text-danger ring-1 ring-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

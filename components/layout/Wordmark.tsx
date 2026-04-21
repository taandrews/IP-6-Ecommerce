import { cn } from "@/lib/utils";

/**
 * IP·6 brand wordmark.
 *
 * A single composition mark: "IP" in a weighted serif, superscript "6" in
 * italic with a leading interpunct, a hairline rule, and the full company
 * name in letter-spaced caps beneath. Built as SVG-via-HTML so the live
 * Fraunces variable font is used.
 */
export function Wordmark({
  variant = "light",
  size = "sm",
  showCompanyLine = true,
  className,
}: {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showCompanyLine?: boolean;
  className?: string;
}) {
  const scale = { sm: 1, md: 1.35, lg: 1.8 }[size];
  const colors =
    variant === "light"
      ? { ink: "text-forest-800", accent: "text-gold-500", rule: "bg-gold-400" }
      : { ink: "text-ivory-100", accent: "text-gold-300", rule: "bg-gold-300" };

  return (
    <span
      className={cn("inline-flex flex-col leading-none select-none", className)}
      style={{ fontSize: `${scale}rem` }}
      aria-label="IP-6 Research, Inc."
    >
      <span className="relative flex items-start font-display" style={{ lineHeight: 0.9 }}>
        <span
          className={cn(colors.ink)}
          style={{
            fontSize: "1.8em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            letterSpacing: "-0.045em",
          }}
        >
          IP
        </span>
        <span
          className={cn("ml-[0.1em] relative", colors.accent)}
          style={{
            fontSize: "0.95em",
            fontStyle: "italic",
            fontVariationSettings: '"opsz" 72, "SOFT" 90',
            top: "0.15em",
          }}
        >
          <span className="opacity-60 mr-[0.08em]">·</span>6
        </span>
      </span>
      {showCompanyLine ? (
        <span className="mt-2 flex items-center gap-2">
          <span className={cn("h-px w-3", colors.rule)} aria-hidden />
          <span
            className={cn("uppercase", colors.ink, "opacity-80")}
            style={{ fontSize: "0.45em", letterSpacing: "0.32em", fontWeight: 500 }}
          >
            Research
          </span>
        </span>
      ) : null}
    </span>
  );
}

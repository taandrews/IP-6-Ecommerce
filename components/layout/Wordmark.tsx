import { cn } from "@/lib/utils";

/**
 * Clinical wordmark. "IP·6 RESEARCH" set in the same sans family used
 * site-wide, with the bullet as the only ornament. No italics, no rules.
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
  const scale = { sm: 1, md: 1.3, lg: 1.7 }[size];
  const ink = variant === "light" ? "text-navy-800" : "text-surface";

  return (
    <span
      className={cn("inline-flex items-baseline gap-2 select-none", className)}
      style={{ fontSize: `${scale}rem` }}
      aria-label="IP-6 Research, Inc."
    >
      <span
        className={cn("font-sans font-bold", ink)}
        style={{ fontSize: "1.4em", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        IP<span className="text-coral-500">·</span>6
      </span>
      {showCompanyLine ? (
        <span
          className={cn("uppercase font-semibold", ink, "opacity-70")}
          style={{ fontSize: "0.55em", letterSpacing: "0.22em" }}
        >
          Research
        </span>
      ) : null}
    </span>
  );
}

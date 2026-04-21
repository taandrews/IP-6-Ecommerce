import { cn } from "@/lib/utils";

/**
 * Per-section grain overlay. Complements the global grain by allowing heavier
 * texture and different blend modes on specific sections (e.g. hero, founder
 * panel, feature strips).
 */
export function Grain({
  intensity = "subtle",
  blend = "multiply",
  className,
}: {
  intensity?: "subtle" | "medium" | "heavy";
  blend?: "multiply" | "overlay" | "screen" | "soft-light";
  className?: string;
}) {
  const opacity = { subtle: 0.04, medium: 0.08, heavy: 0.13 }[intensity];
  const scale = { subtle: "340px", medium: "220px", heavy: "160px" }[intensity];
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{
        backgroundImage: "url(https://dcstwo4ifc9iy.cloudfront.net/ui/grain.svg)",
        backgroundSize: `${scale} ${scale}`,
        opacity,
        mixBlendMode: blend,
      }}
    />
  );
}

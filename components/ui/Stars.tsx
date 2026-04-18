import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, size = 16, className }: { rating: number; size?: number; className?: string }) {
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(
            "text-gold-400",
            i <= Math.round(rating) ? "fill-gold-400" : "fill-transparent opacity-50",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

import { Check, Minus, X } from "lucide-react";
import { COMPARISON_ROWS, type ComparisonMark } from "@/content/comparison";
import { cn } from "@/lib/utils";

type Variant = "light" | "dark";

function Mark({ mark, strong, variant }: { mark: ComparisonMark; strong?: boolean; variant: Variant }) {
  const dark = variant === "dark";
  if (mark === "yes") {
    return (
      <span
        className={cn(
          "inline-grid size-5 shrink-0 place-items-center rounded-full",
          dark ? "bg-gold-500 text-navy-900" : strong ? "bg-navy-800 text-surface" : "bg-navy-800/10 text-navy-800",
        )}
        aria-label="Yes"
      >
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (mark === "partial") {
    return (
      <span
        className={cn(
          "inline-grid size-5 shrink-0 place-items-center rounded-full border",
          dark ? "border-cream/30 text-cream/50" : "border-ink/25 text-ink/45",
        )}
        aria-label="Partial"
      >
        <Minus className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-grid size-5 shrink-0 place-items-center rounded-full border",
        dark ? "border-cream/25 text-cream/40" : "border-ink/20 text-ink/35",
      )}
      aria-label="No"
    >
      <X className="size-3" strokeWidth={3} aria-hidden />
    </span>
  );
}

/**
 * Specification table. Light variant tints our column; dark variant sits on
 * navy with mono labels, gold check marks, and 1px gold rules, no card chrome.
 * Phone width renders stacked rows so our column is never off-screen.
 */
export function ComparisonTable({ className, variant = "light" }: { className?: string; variant?: Variant }) {
  const dark = variant === "dark";
  const rule = dark ? "border-gold-500/50" : "border-navy-800/15";
  const dotted = dark ? "border-gold-500/35" : "border-navy-800/20";
  const lbl = dark ? "font-mono text-[12px] uppercase tracking-[0.12em] text-cream/60" : "text-[10px] uppercase tracking-[0.22em] text-ink/55 font-bold";
  const lblOurs = dark ? "font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400" : "text-[10px] uppercase tracking-[0.22em] text-navy-800 font-bold";
  const theirs = dark ? "text-cream/60" : "text-ink/65";
  const ours = dark ? "text-cream font-medium" : "text-navy-800 font-medium";
  const rowHead = dark ? "font-mono text-[12px] uppercase tracking-[0.12em] text-cream" : "font-semibold text-navy-800";
  const oursBg = dark ? "" : "bg-navy-50";

  return (
    <div className={className}>
      {/* Phone width: stacked rows */}
      <ul className={cn("md:hidden divide-y divide-dotted border-y", rule, dark ? "divide-gold-500/35" : "divide-navy-800/20")}>
        {COMPARISON_ROWS.map((row) => (
          <li key={row.label} className="py-4">
            <p className={rowHead}>{row.label}</p>
            <div className={cn("mt-2 flex items-start gap-3 text-sm", theirs)}>
              <Mark mark={row.commodity.mark} variant={variant} />
              <span>
                <span className={cn("block", lbl)}>Commodity IP6</span>
                {row.commodity.text}
              </span>
            </div>
            <div className={cn("mt-2 flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm", ours, oursBg, dark && "border border-gold-500/40")}>
              <Mark mark={row.original.mark} strong variant={variant} />
              <span>
                <span className={cn("block", lblOurs)}>IP6 Original</span>
                {row.original.text}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <table className="hidden md:table w-full border-collapse text-[15px]">
        <thead>
          <tr className={cn("border-b", rule)}>
            <th scope="col" className="py-4 pr-4 text-left align-bottom">
              <span className={lbl}>Specification</span>
            </th>
            <th scope="col" className="py-4 px-4 text-left align-bottom">
              <span className={cn("block", lbl)}>Commodity IP6</span>
              <span className={cn("mt-1 block text-xs font-normal", theirs)}>Most supplements on shelves</span>
            </th>
            <th scope="col" className={cn("py-4 px-4 text-left align-bottom", oursBg, !dark && "rounded-t-xl")}>
              <span className={cn("block", lblOurs)}>IP6 Original</span>
              <span className={cn("mt-1 block text-xs font-normal", dark ? "text-cream/70" : "text-ink/65")}>From the lab of Prof. Shamsuddin</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => {
            const last = i === COMPARISON_ROWS.length - 1;
            return (
              <tr key={row.label} className={cn(!last && "border-b border-dotted", !last && dotted)}>
                <th scope="row" className={cn("py-4 pr-4 text-left align-top", rowHead)}>
                  {row.label}
                </th>
                <td className="py-4 px-4 align-top">
                  <div className={cn("flex items-start gap-3", theirs)}>
                    <Mark mark={row.commodity.mark} variant={variant} />
                    <span className="pt-px">{row.commodity.text}</span>
                  </div>
                </td>
                <td className={cn("py-4 px-4 align-top", oursBg, !dark && last && "rounded-b-xl")}>
                  <div className={cn("flex items-start gap-3", ours)}>
                    <Mark mark={row.original.mark} strong variant={variant} />
                    <span className="pt-px">{row.original.text}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

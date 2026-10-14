import { Check, Minus, X } from "lucide-react";
import { COMPARISON_ROWS, type ComparisonMark } from "@/content/comparison";
import { cn } from "@/lib/utils";

function Mark({ mark, strong }: { mark: ComparisonMark; strong?: boolean }) {
  if (mark === "yes") {
    return (
      <span
        className={cn(
          "inline-grid size-5 shrink-0 place-items-center rounded-full",
          strong ? "bg-navy-800 text-surface" : "bg-navy-800/10 text-navy-800",
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
        className="inline-grid size-5 shrink-0 place-items-center rounded-full border border-ink/25 text-ink/45"
        aria-label="Partial"
      >
        <Minus className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className="inline-grid size-5 shrink-0 place-items-center rounded-full border border-ink/20 text-ink/35"
      aria-label="No"
    >
      <X className="size-3" strokeWidth={3} aria-hidden />
    </span>
  );
}

/**
 * Specification table. The IP6 Original column is tinted so the eye lands on
 * it first; the commodity column stays neutral. Marks carry aria labels so
 * the table reads correctly without the icons.
 */
export function ComparisonTable({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* Phone width: stacked rows so the IP6 Original column is never off-screen */}
      <ul className="md:hidden divide-y divide-dotted divide-navy-800/20 border-y border-navy-800/15">
        {COMPARISON_ROWS.map((row) => (
          <li key={row.label} className="py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-bold">{row.label}</p>
            <div className="mt-2 flex items-start gap-3 text-sm text-ink/65">
              <Mark mark={row.commodity.mark} />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-ink/45 font-semibold">Commodity IP6</span>
                {row.commodity.text}
              </span>
            </div>
            <div className="mt-2 flex items-start gap-3 rounded-lg bg-navy-50 px-3 py-2.5 text-sm font-medium text-navy-800">
              <Mark mark={row.original.mark} strong />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-navy-800/60 font-semibold">IP6 Original</span>
                {row.original.text}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <table className="hidden md:table w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-navy-800/15">
            <th scope="col" className="py-4 pr-4 text-left align-bottom">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink/55 font-bold">
                Specification
              </span>
            </th>
            <th scope="col" className="py-4 px-4 text-left align-bottom">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/55 font-bold">
                Commodity IP6
              </span>
              <span className="mt-1 block text-xs font-normal text-ink/55">Most supplements on shelves</span>
            </th>
            <th scope="col" className="rounded-t-xl bg-navy-50 py-4 px-4 text-left align-bottom">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-navy-800 font-bold">
                IP6 Original
              </span>
              <span className="mt-1 block text-xs font-normal text-ink/65">From the lab of Prof. Shamsuddin</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => {
            const last = i === COMPARISON_ROWS.length - 1;
            return (
              <tr key={row.label} className={cn(!last && "border-b border-dotted border-navy-800/20")}>
                <th scope="row" className="py-4 pr-4 text-left font-semibold text-navy-800 align-top">
                  {row.label}
                </th>
                <td className="py-4 px-4 align-top">
                  <div className="flex items-start gap-3 text-ink/65">
                    <Mark mark={row.commodity.mark} />
                    <span className="pt-px">{row.commodity.text}</span>
                  </div>
                </td>
                <td className={cn("bg-navy-50 py-4 px-4 align-top", last && "rounded-b-xl")}>
                  <div className="flex items-start gap-3 font-medium text-navy-800">
                    <Mark mark={row.original.mark} strong />
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

import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, intro, actions }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl text-navy-800">{title}</h1>
        {intro ? <p className="mt-1 text-sm text-ink/65 max-w-2xl">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-cloud-300 bg-surface", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-cloud-300 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-800">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/55 font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy-800 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/60">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-lg border border-cloud-300 bg-surface p-5 hover:border-navy-800/40 transition-colors">
      {body}
    </Link>
  ) : (
    <div className="rounded-lg border border-cloud-300 bg-surface p-5">{body}</div>
  );
}

const TONES = {
  neutral: "bg-cloud-100 text-ink/75 border-cloud-300",
  good: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  bad: "bg-red-50 text-red-800 border-red-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone])}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink/60">{children}</p>;
}

export function Table({ head, children, minWidth = 640 }: { head: React.ReactNode[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-cloud-300 bg-surface">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="bg-cloud-100 text-left text-xs uppercase tracking-wide text-ink/60">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cloud-300">{children}</tbody>
      </table>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <div className={cn("rounded-md border px-4 py-3 text-sm", TONES[tone])}>{children}</div>;
}

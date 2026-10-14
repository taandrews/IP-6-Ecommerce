import Link from "next/link";
import { Award, ShieldCheck, FlaskConical, Truck, CheckCircle2, FileText } from "lucide-react";

const STATS = [
  { n: "1998", l: "First paper" },
  { n: "1,000", u: "mg", l: "Per serving" },
  { n: "0", l: "Processing additives" },
  { n: "1", l: "Named formulator" },
];

const BADGES = [
  { icon: Award, t: "cGMP Certified" },
  { icon: ShieldCheck, t: "Third-Party Tested" },
  { icon: FlaskConical, t: "High-Purity Formula" },
  { icon: Truck, t: "Ships US & Canada" },
  { icon: CheckCircle2, t: "30-day returns" },
];

/** Credibility strip: large serif numerals, mono labels, fifth tile links to the test report. */
export function Credibility() {
  return (
    <section className="bg-cream text-navy-800" aria-label="Credibility">
      <div className="container py-[72px] lg:py-[96px]">
        <ol className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          {STATS.map((s) => (
            <li key={s.l} className="border-t border-gold-500/60 pt-5">
              <p className="font-serif text-[48px] leading-none tracking-[-0.02em] lg:text-[64px] tabular-nums whitespace-nowrap">
                {s.n}
                {s.u ? <span className="ml-1 font-mono text-[14px] tracking-normal text-navy-800/75">{s.u}</span> : null}
              </p>
              <p className="eyebrow mt-4">{s.l}</p>
            </li>
          ))}
          <li className="border-t border-gold-500/60 pt-5">
            <Link href="/the-difference#test-report" className="group block">
              <p className="font-serif text-[48px] leading-none tracking-[-0.02em] lg:text-[64px]">
                <FileText className="inline-block size-10 align-[-0.1em] text-gold-700 transition-colors group-hover:text-navy-800 lg:size-14" aria-hidden />
              </p>
              <p className="eyebrow mt-4 underline decoration-gold-500 underline-offset-4 group-hover:text-navy-800">Batch tested</p>
            </Link>
          </li>
        </ol>

        <ul className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-navy-800/10 pt-6 font-mono text-[12px] uppercase tracking-[0.12em] text-navy-800/70">
          {BADGES.map((b) => (
            <li key={b.t} className="flex items-center gap-2">
              <b.icon className="size-3.5 text-gold-700" aria-hidden />
              {b.t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

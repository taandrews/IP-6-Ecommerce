import { Award, ShieldCheck, FlaskConical, Truck, CheckCircle2, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: Award, text: "cGMP Certified" },
  { icon: ShieldCheck, text: "Third-Party Tested" },
  { icon: FlaskConical, text: "High-Purity Formula" },
  { icon: Truck, text: "Free US shipping over $75" },
  { icon: CheckCircle2, text: "Made in USA" },
];

/**
 * The label's badges as a slow, continuous ticker under the hero. The list is
 * rendered twice so the loop is seamless; with reduced motion it stands still
 * and wraps. Every line is label wording or a store setting.
 */
export function TrustTicker() {
  const row = (ariaHidden: boolean) => (
    <ul className="ticker-row" aria-hidden={ariaHidden || undefined}>
      {ITEMS.map((it) => (
        <li key={it.text} className="flex items-center gap-2.5 whitespace-nowrap text-[13px] sm:text-sm uppercase tracking-[0.18em] font-semibold text-navy-800">
          <it.icon className="size-5 text-gold-600 shrink-0" aria-hidden />
          {it.text}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker border-t border-b border-cloud-300 bg-surface py-4" aria-label="Product standards">
      <div className="ticker-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

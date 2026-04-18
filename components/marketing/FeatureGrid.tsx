import type { LucideIcon } from "lucide-react";

export function FeatureGrid({
  features,
  heading,
  eyebrow,
}: {
  features: { icon: LucideIcon; title: string; body: string }[];
  heading?: string;
  eyebrow?: string;
}) {
  return (
    <section className="container py-16 lg:py-20">
      {heading ? (
        <div className="text-center max-w-2xl mx-auto mb-12">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h2 className="font-display text-display-lg text-forest-800">{heading}</h2>
        </div>
      ) : null}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-6 rounded-lg border border-ivory-300 bg-surface">
            <div className="inline-grid place-items-center size-11 rounded-full bg-forest-50 text-forest-700 mb-4">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-display text-lg text-forest-800 mb-2">{f.title}</h3>
            <p className="text-sm text-ink/75 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

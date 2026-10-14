import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MoleculeMark } from "@/components/home/MoleculeMark";

const STEPS = [
  { k: "Timing", t: "On an empty stomach", b: "30 minutes before food, or 2 hours after." },
  { k: "Water", t: "With water only", b: "8 oz minimum. Avoid mineral-rich beverages within an hour." },
  { k: "Guidance", t: "Consult your physician", b: "Always discuss new supplements with your healthcare professional." },
];

/** How to take: navy band, three mono-numbered steps, lifestyle image slot with solid fallback. */
export function HowToTake({ hasLifestyle, shopHref }: { hasLifestyle: boolean; shopHref: string }) {
  return (
    <section className="bg-navy-800 text-cream section-y" aria-labelledby="how-h">
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:aspect-[4/5]">
          {hasLifestyle ? (
            <Image
              src="/lifestyle-water.webp"
              alt="IP6 Original bottle beside a glass of water."
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-navy-700" aria-hidden>
              <MoleculeMark size="46%" className="opacity-60 [&_path]:!stroke-gold-500 [&_line]:!stroke-gold-500 [&_circle]:!fill-gold-500" />
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow-light mb-5">The Action</p>
          <h2 id="how-h" className="h-section text-cream text-balance">
            Take it. Here is exactly how.
          </h2>
          <p className="body-lg mt-6 max-w-xl font-serif text-cream/80">
            Take IP6 Original on an empty stomach, at least 30 minutes before food or two hours after. Always consult your physician before beginning any supplement regimen.
          </p>
          <ol className="mt-10 border-t border-gold-500/40">
            {STEPS.map((s) => (
              <li key={s.t} className="grid grid-cols-[6rem_1fr] gap-4 border-b border-gold-500/40 py-5">
                <span className="pt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400">
                  {s.k}
                </span>
                <div>
                  <p className="font-medium text-cream">{s.t}</p>
                  <p className="mt-1 text-sm text-cream/65">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href={shopHref} className="btn-gold">
              Shop IP6 Original
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/faq#how-to-take" className="btn-outline-cream">
              Full dosing guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

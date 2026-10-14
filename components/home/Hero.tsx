"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CAPTIONS = [
  { k: "molecule", t: "The molecule", b: "Inositol hexaphosphate, paired with Inositol, the way the research describes the two." },
  { k: "purity", t: "The purity", b: "A high-purity formula with no magnesium stearate and no silicon dioxide. Third-party tested, batch report published." },
  { k: "founder", t: "The founder", b: "Formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD, the physician-scientist who pioneered the work." },
];

/**
 * Full-bleed navy hero, pinned for 300vh. The bottle stays fixed while three
 * chapter captions fade past it. With prefers-reduced-motion the section
 * renders static at one screen with the captions listed.
 *
 * Bottle frames: when /public/bottle/frame-000.webp ... frame-059.webp exist
 * the server passes their URLs and scroll progress scrubs the sequence.
 * Otherwise the single bottle image is shown.
 */
export function Hero({
  frames,
  price,
  shopHref,
}: {
  frames: string[];
  price: string;
  shopHref: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll progress through the 300vh track, 0 to 1.
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    setReady(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Preload frames once so scrubbing never flashes.
  useEffect(() => {
    if (!frames.length) return;
    frames.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [frames]);

  const hasFrames = frames.length > 0;
  const frameIndex = hasFrames ? Math.min(frames.length - 1, Math.round(progress * (frames.length - 1))) : 0;
  // Caption 0 shows from 0.15 to 0.4, caption 1 from 0.45 to 0.7, caption 2 from 0.75 to 1
  const active = progress < 0.42 ? 0 : progress < 0.72 ? 1 : 2;
  const captionsVisible = progress > 0.12;

  return (
    <section
      ref={ref}
      data-hero-fullbleed
      className={cn("relative bg-navy-800 text-cream", reduced ? "min-h-screen" : "h-[300vh]")}
      aria-label="IP6 Original"
    >
      <div className={cn("top-0 h-screen min-h-[640px] w-full overflow-hidden", reduced ? "relative" : "sticky")}>
        {/* Radial gold light behind the bottle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[58%]"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 62% 55%, rgba(201,169,97,0.38) 0%, rgba(201,169,97,0.12) 38%, rgba(11,31,58,0) 72%)",
          }}
        />

        <div className="container relative grid h-full grid-cols-1 items-center gap-8 pt-[120px] pb-12 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Copy */}
          <div className="relative z-10">
            <p className="eyebrow-light mb-7">From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD</p>
            <h1 className="h-statement text-cream text-balance">
              There is only one <em className="font-serif italic">IP6 Original</em>.
            </h1>
            <p className="body-lg mt-7 max-w-xl text-cream/80">
              The original IP6 formula, formulated by the physician-scientist who pioneered the research behind it. One supplement, made to the specification his work describes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href={shopHref} className="btn-gold">
                Shop IP6 Original · {price}
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/story" className="btn-outline-cream">
                Read the story
              </Link>
            </div>

            {/* Chapter captions: fade past the pinned bottle */}
            {reduced ? (
              <ol className="mt-12 grid gap-5 border-t border-cream/15 pt-8 sm:grid-cols-3">
                {CAPTIONS.map((c) => (
                  <li key={c.k}>
                    <p className="eyebrow-light">{c.t}</p>
                    <p className="mt-2 text-sm text-cream/70">{c.b}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="relative mt-12 h-24 border-t border-cream/15 pt-6" aria-live="polite">
                {CAPTIONS.map((c, i) => (
                  <div
                    key={c.k}
                    className={cn(
                      "absolute inset-x-0 top-6 max-w-md transition-all duration-500 ease-out",
                      captionsVisible && active === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                    )}
                    aria-hidden={!(captionsVisible && active === i)}
                  >
                    <p className="eyebrow-light">{c.t}</p>
                    <p className="mt-2 text-sm text-cream/70">{c.b}</p>
                  </div>
                ))}
                <p
                  className={cn(
                    "absolute inset-x-0 top-6 font-mono text-[12px] uppercase tracking-[0.12em] text-cream/70 transition-opacity duration-500",
                    captionsVisible || !ready ? "opacity-0" : "opacity-100",
                  )}
                  aria-hidden
                >
                  Scroll
                </p>
              </div>
            )}
          </div>

          {/* Bottle, pinned */}
          <div className="relative mx-auto h-[380px] w-full max-w-[520px] sm:h-[460px] lg:h-[70vh] lg:max-h-[720px] lg:justify-self-end">
            {hasFrames ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frames[frameIndex]}
                alt="IP6 Original Supplement bottle"
                width={1000}
                height={1250}
                className="absolute inset-0 h-full w-full object-contain"
                decoding="async"
              />
            ) : (
              <Image
                src="/products/supplement-real.png"
                alt="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

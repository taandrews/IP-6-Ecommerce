"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Inositol ring with six phosphate groups. At full size the strokes draw on
 * when scrolled into view (1.2s). At 32px it is a static divider mark.
 */
export function MoleculeMark({
  size = 32,
  animate = false,
  className,
}: {
  size?: number | string;
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  // Hexagon ring of six carbons, each carrying one phosphate (gold node).
  const cx = 160, cy = 160, r = 64, rp = 128;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), px: cx + rp * Math.cos(a), py: cy + rp * Math.sin(a) };
  });
  const ring = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 320"
      width={size}
      height={size}
      aria-hidden
      className={cn("molecule", on && "is-on", className)}
      style={{ width: size, height: size }}
    >
      <style>{`
        .molecule path, .molecule line { stroke-dasharray: 420; stroke-dashoffset: 420; }
        .molecule circle.p { opacity: 0; transform-origin: center; }
        .molecule.is-on path, .molecule.is-on line { animation: mol-draw 1.2s cubic-bezier(.2,.65,.2,1) forwards; }
        .molecule.is-on line:nth-of-type(1) { animation-delay: .2s } .molecule.is-on line:nth-of-type(2) { animation-delay: .3s }
        .molecule.is-on line:nth-of-type(3) { animation-delay: .4s } .molecule.is-on line:nth-of-type(4) { animation-delay: .5s }
        .molecule.is-on line:nth-of-type(5) { animation-delay: .6s } .molecule.is-on line:nth-of-type(6) { animation-delay: .7s }
        .molecule.is-on circle.p { animation: mol-pop .4s ease-out forwards; }
        .molecule.is-on circle.p:nth-of-type(1) { animation-delay: .7s } .molecule.is-on circle.p:nth-of-type(2) { animation-delay: .8s }
        .molecule.is-on circle.p:nth-of-type(3) { animation-delay: .9s } .molecule.is-on circle.p:nth-of-type(4) { animation-delay: 1s }
        .molecule.is-on circle.p:nth-of-type(5) { animation-delay: 1.1s } .molecule.is-on circle.p:nth-of-type(6) { animation-delay: 1.2s }
        @keyframes mol-draw { to { stroke-dashoffset: 0; } }
        @keyframes mol-pop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .molecule path, .molecule line { stroke-dashoffset: 0 !important; animation: none !important; }
          .molecule circle.p { opacity: 1 !important; animation: none !important; }
        }
      `}</style>
      <path d={ring} fill="none" stroke="#0B1F3A" strokeWidth={4} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <line key={`l${i}`} x1={p.x} y1={p.y} x2={p.px} y2={p.py} stroke="#0B1F3A" strokeWidth={3} strokeLinecap="round" />
      ))}
      {pts.map((p, i) => (
        <circle key={`c${i}`} cx={p.x} cy={p.y} r={7} fill="#0B1F3A" />
      ))}
      {pts.map((p, i) => (
        <circle key={`p${i}`} className="p" cx={p.px} cy={p.py} r={14} fill="#C9A961" />
      ))}
    </svg>
  );
}

/** 32px molecule used as a section divider. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)} aria-hidden>
      <span className="h-px flex-1 bg-gold-500/40" />
      <MoleculeMark size={32} />
      <span className="h-px flex-1 bg-gold-500/40" />
    </div>
  );
}

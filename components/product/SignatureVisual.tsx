"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductCategory } from "@/types";

/**
 * Each product category gets its own signature visual that anchors the hero.
 * Supplement: an animated purity dial ticking to 95%.
 * Skincare:   a ceramide-reactor, concentric rings annotated with ingredient labels.
 * Filter:     a flow-rate counter ticking up to 60 seconds.
 */
export function SignatureVisual({ category }: { category: ProductCategory }) {
  if (category === "supplement") return <PurityDial />;
  if (category === "skincare") return <CeramideReactor />;
  return <FlowCounter />;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView] as const;
}

function PurityDial() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const target = 95.3;
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1600;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const pct = (value / 100) * 360;
  return (
    <div ref={ref} className="relative aspect-square w-full max-w-md mx-auto" aria-hidden>
      <svg viewBox="0 0 200 200" className="w-full h-auto">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(201 168 76)" />
            <stop offset="100%" stopColor="rgb(27 67 50)" />
          </linearGradient>
        </defs>
        <circle cx={100} cy={100} r={85} fill="none" stroke="rgb(27 67 50 / 0.12)" strokeWidth={6} />
        <circle
          cx={100}
          cy={100}
          r={85}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 360) * 2 * Math.PI * 85} ${2 * Math.PI * 85}`}
          transform="rotate(-90 100 100)"
        />
        <text
          x={100}
          y={98}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgb(27 67 50)"
          style={{ fontFamily: "var(--font-display)", fontSize: 44, fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.03em" }}
        >
          {value.toFixed(1)}
          <tspan style={{ fontSize: 20 }}>%</tspan>
        </text>
        <text
          x={100}
          y={128}
          textAnchor="middle"
          fill="rgb(27 67 50 / 0.65)"
          style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          IP6 intact
        </text>
      </svg>
      <p className="text-center text-[11px] uppercase tracking-[0.28em] text-ink/60 mt-2">
        Batch SUP-IP6-B0426-A · measured by HPLC
      </p>
    </div>
  );
}

function CeramideReactor() {
  const LAYERS = [
    { label: "Ceramide NP", r: 30, opacity: 0.95 },
    { label: "Shea butter", r: 55, opacity: 0.75 },
    { label: "IP6 complex", r: 78, opacity: 0.6 },
    { label: "Niacinamide", r: 100, opacity: 0.45 },
    { label: "Allantoin", r: 120, opacity: 0.3 },
  ];
  return (
    <div className="relative aspect-square w-full max-w-md mx-auto" aria-hidden>
      <svg viewBox="0 0 260 260" className="w-full h-auto">
        <defs>
          <radialGradient id="core">
            <stop offset="0%" stopColor="rgb(201 168 76)" />
            <stop offset="100%" stopColor="rgb(27 67 50)" />
          </radialGradient>
        </defs>
        {LAYERS.slice().reverse().map((l, i) => (
          <circle
            key={l.label}
            cx={130}
            cy={130}
            r={l.r}
            fill="none"
            stroke="rgb(27 67 50)"
            strokeWidth={0.8}
            strokeOpacity={l.opacity}
            className="transition-all duration-700"
            style={{ animation: `ring-breathe 6s ease-in-out ${i * 0.4}s infinite` }}
          />
        ))}
        <circle cx={130} cy={130} r={14} fill="url(#core)" />
        {LAYERS.map((l, i) => {
          const angle = (i / LAYERS.length) * Math.PI * 2 - Math.PI / 2;
          const x = 130 + Math.cos(angle) * (l.r + 8);
          const y = 130 + Math.sin(angle) * (l.r + 8);
          const anchor = x > 130 ? "start" : "end";
          return (
            <text
              key={`label-${l.label}`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              fill="rgb(27 67 50 / 0.75)"
              style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              {l.label}
            </text>
          );
        })}
      </svg>
      <style jsx>{`
        @keyframes ring-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
      `}</style>
      <p className="text-center text-[11px] uppercase tracking-[0.28em] text-ink/60 mt-2">
        Cortisone-free barrier formulation
      </p>
    </div>
  );
}

function FlowCounter() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [seconds, setSeconds] = useState(0);
  const [liters, setLiters] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 3600;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setSeconds(60 * eased);
      setLiters(2 * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div ref={ref} className="relative aspect-square w-full max-w-md mx-auto flex flex-col justify-center" aria-hidden>
      <div className="relative pl-14 border-l border-gold-400/60 py-8">
        <div className="absolute -left-[3px] top-8 size-1.5 rounded-full bg-gold-400" />
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink/60">Second</p>
        <p className="font-display text-forest-800" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.035em", lineHeight: 0.9 }}>
          {seconds.toFixed(0).padStart(2, "0")}
          <span className="italic text-forest-600 opacity-60" style={{ fontSize: "0.5em" }}> /60</span>
        </p>
      </div>
      <div className="relative pl-14 border-l border-gold-400/60 py-8">
        <div className="absolute -left-[3px] top-8 size-1.5 rounded-full bg-gold-400" />
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink/60">Liters filtered</p>
        <p className="font-display text-forest-800" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.035em", lineHeight: 0.9 }}>
          {liters.toFixed(2)}
          <span className="italic text-forest-600 opacity-60" style={{ fontSize: "0.5em" }}>L</span>
        </p>
      </div>
      <p className="text-center text-[11px] uppercase tracking-[0.28em] text-ink/60 mt-6">
        Typical household flow · gravity-fed
      </p>
    </div>
  );
}

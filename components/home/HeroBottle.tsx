"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./HeroBottle.module.css";

/**
 * Home hero bottle sequence: drop-in with overshoot, wide float, molecule
 * spheres orbiting in 3D (the ball-and-stick motif from the label), gold rings,
 * pointer tilt and scroll parallax. Static under prefers-reduced-motion.
 * The photo is the client's 120-count bottle cut to a transparent PNG.
 */

const RING_A = [
  { a: 0, size: 26, tone: "gold" },
  { a: 72, size: 16, tone: "navy" },
  { a: 144, size: 22, tone: "gold" },
  { a: 216, size: 14, tone: "navy" },
  { a: 288, size: 20, tone: "gold" },
] as const;

const RING_B = [
  { a: 30, size: 18, tone: "navy" },
  { a: 120, size: 24, tone: "gold" },
  { a: 210, size: 14, tone: "gold" },
  { a: 300, size: 20, tone: "navy" },
] as const;

export function HeroBottle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const area: HTMLElement = el.closest("section") ?? el;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 22).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(x * 36).toFixed(1)}px`);
        el.style.setProperty("--ty", `${(y * 24).toFixed(1)}px`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      for (const v of ["--rx", "--ry", "--tx", "--ty"]) el.style.removeProperty(v);
    };
    const onScroll = () => {
      const y = Math.min(window.scrollY, 900);
      el.style.setProperty("--py", `${(y * 0.22).toFixed(1)}px`);
    };

    if (finePointer) {
      area.addEventListener("pointermove", onMove);
      area.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.stage}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.ring} aria-hidden />
      <div className={styles.ring} aria-hidden />
      <div className={styles.ring} aria-hidden />
      <div className={styles.tilt}>
        <div className={`${styles.orbit} ${styles.orbitA}`} aria-hidden>
          {RING_A.map((n) => (
            <span
              key={n.a}
              className={`${styles.node} ${n.tone === "gold" ? styles.gold : styles.navy}`}
              style={{ ["--a" as string]: `${n.a}deg`, ["--size" as string]: `${n.size}px` }}
            />
          ))}
        </div>
        <div className={styles.float}>
          <Image
            src="/products/supplement-hero.png"
            alt="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
            width={532}
            height={900}
            priority
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 280px, 220px"
            className={styles.img}
          />
        </div>
        <div className={`${styles.orbit} ${styles.orbitB}`} aria-hidden>
          {RING_B.map((n) => (
            <span
              key={n.a}
              className={`${styles.node} ${n.tone === "gold" ? styles.gold : styles.navy}`}
              style={{ ["--a" as string]: `${n.a}deg`, ["--size" as string]: `${n.size}px` }}
            />
          ))}
        </div>
      </div>
      <div className={styles.shadow} aria-hidden />
    </div>
  );
}

/** Splits a headline into words that rise in one after another. */
export function HeroWords({ text, accent }: { text: string; accent?: string }) {
  const words = text.split(" ");
  let i = 0;
  const out: ReactNode[] = words.map((w) => (
    <span key={`w${i}`} className={styles.word} style={{ ["--i" as string]: i++ }}>
      {w}&nbsp;
    </span>
  ));
  if (accent) {
    const aw = accent.split(" ");
    aw.forEach((w, k) => {
      out.push(
        <span key={`a${i}`} className={`${styles.word} text-sky-700`} style={{ ["--i" as string]: i++ }}>
          {w}
          {k < aw.length - 1 ? " " : ""}
        </span>,
      );
    });
    out.push(
      <span key="dot" className={styles.word} style={{ ["--i" as string]: i++ }}>
        .
      </span>,
    );
  }
  return <>{out}</>;
}

/** Wraps a block so it rises after the headline. */
export function HeroLine({ delay, children, className }: { delay: number; children: ReactNode; className?: string }) {
  return (
    <div className={`${styles.line}${className ? ` ${className}` : ""}`} style={{ ["--d" as string]: `${delay}s` }}>
      {children}
    </div>
  );
}

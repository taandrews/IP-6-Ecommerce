"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./HeroBottle.module.css";

/**
 * Home hero bottle: slow drift, soft gold halo, ground shadow, and a gentle
 * tilt toward the pointer. Static under prefers-reduced-motion and on touch.
 * The photo is the client's 120-count bottle cut to a transparent PNG.
 */
export function HeroBottle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const area: HTMLElement = el.closest("section") ?? el;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(x * 14).toFixed(1)}px`);
        el.style.setProperty("--ty", `${(y * 10).toFixed(1)}px`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      for (const v of ["--rx", "--ry", "--tx", "--ty"]) el.style.removeProperty(v);
    };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.stage}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.tilt}>
        <div className={styles.float}>
          <Image
            src="/products/supplement-hero.png"
            alt="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
            width={532}
            height={900}
            priority
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 260px, 210px"
            className={styles.img}
          />
        </div>
      </div>
      <div className={styles.shadow} aria-hidden />
    </div>
  );
}

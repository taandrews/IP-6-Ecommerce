"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./HeroBottle.module.css";

/**
 * Home hero: a short muted product film of the client's real bottle (slow
 * push-in with a gold light sweep, mirrored into a seamless loop), blended into
 * the white page. Fades in on load and parallaxes on scroll. Under reduced
 * motion the poster frame is shown and the film never plays.
 */
export function HeroBottle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const y = Math.min(window.scrollY, 900);
      el.style.setProperty("--py", `${(y * 0.12).toFixed(1)}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className={styles.stage}>
      <div className={styles.frame}>
        <video
          className={styles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/video/ip6-hero-poster.jpg"
          aria-label="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
        >
          <source src="/video/ip6-hero-loop.webm" type="video/webm" />
          <source src="/video/ip6-hero-loop.mp4" type="video/mp4" />
        </video>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.poster}
          src="/video/ip6-hero-poster.jpg"
          alt="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD."
          width={720}
          height={960}
        />
      </div>
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./HeroSlideshow.module.css";

/* Full-bleed photo slideshow. Each slide opens under a navy-to-cyan duotone while the
   headline types in letter by letter, then the tint lifts to reveal the colour photo.
   Every headline traces to the label, a Shopify setting, or copy already on the site. */

type Segment = { text: string; em?: boolean };
type Slide = { src: string; pos: string; alt: string; eyebrow: string; line: Segment[] };

const SLIDES: Slide[] = [
  { src: "/hero/ip6-hero-1.webp", pos: "50% 30%", alt: "An older couple dancing and laughing on a sunny beach", eyebrow: "From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD", line: [{ text: "There is only one " }, { text: "IP6 Original", em: true }, { text: "." }] },
  { src: "/hero/ip6-hero-2.webp", pos: "50% 12%", alt: "A grey-haired man riding a mountain bike above a wooded valley", eyebrow: "The original IP6 formula", line: [{ text: "From the scientist who " }, { text: "pioneered IP6", em: true }, { text: "." }] },
  { src: "/hero/ip6-hero-3.webp", pos: "50% 8%", alt: "A woman in her sixties laughing in golden evening light", eyebrow: "On the label, every serving", line: [{ text: "804 mg IP6.", em: true }, { text: " 196 mg Inositol." }] },
  { src: "/hero/ip6-hero-4.webp", pos: "50% 35%", alt: "A couple with backpacks and trekking poles smiling on a misty trail", eyebrow: "Every bottle", line: [{ text: "Made in the USA. " }, { text: "Third-party tested.", em: true }] },
  { src: "/hero/ip6-hero-5.webp", pos: "55% 40%", alt: "A woman meditating cross-legged on a yoga mat in a bright living room", eyebrow: "One supplement, one specification", line: [{ text: "The formula " }, { text: "his research", em: true }, { text: " describes." }] },
  { src: "/hero/ip6-hero-6.webp", pos: "50% 45%", alt: "An older couple carrying surfboards along the beach", eyebrow: "Pre-order, ships November 2026", line: [{ text: "Pre-order now. " }, { text: "15% off.", em: true }] },
];

const TYPE_MS = 42;
const TYPE_DELAY = 500;
const REVEAL_AFTER_TYPED = 350;
const REVEAL_MS = 1400;
const HOLD_AFTER_REVEAL = 2600;

const charCount = (line: Segment[]) => line.reduce((n, s) => n + s.text.replace(/ /g, "").length, 0);

function PauseIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 5v14l12-7z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
  );
}

export function HeroSlideshow({ ctaHref }: { ctaHref: string }) {
  const [cur, setCur] = useState(0);
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const timers = useRef<number[]>([]);
  const pausedRef = useRef(false);
  const [runKey, setRunKey] = useState(0);

  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Run one slide: type, reveal, hold, advance. Re-runs when the slide changes or play resumes.
  useEffect(() => {
    clear();
    const slide = SLIDES[cur];
    if (!slide) return;
    const total = charCount(slide.line);
    if (reduce) {
      setTyped(total);
      setRevealed(true);
      return;
    }
    setTyped(0);
    setRevealed(false);
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    for (let k = 1; k <= total; k++) later(() => setTyped(k), TYPE_DELAY + k * TYPE_MS);
    const typedAt = TYPE_DELAY + total * TYPE_MS;
    later(() => setRevealed(true), typedAt + REVEAL_AFTER_TYPED);
    later(() => {
      if (!pausedRef.current) setCur((c) => (c + 1) % SLIDES.length);
    }, typedAt + REVEAL_AFTER_TYPED + REVEAL_MS + HOLD_AFTER_REVEAL);
    return clear;
  }, [cur, reduce, runKey, clear]);

  // Stop the clock while the tab is hidden; restart the current slide when it comes back.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) clear();
      else if (!pausedRef.current) setRunKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [clear]);

  const goTo = (i: number) => {
    pausedRef.current = true;
    setPaused(true);
    setCur(i);
  };
  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) setRunKey((k) => k + 1);
  };

  let seen = 0;
  const renderLine = (slide: Slide, active: boolean) =>
    slide.line.map((seg, si) => {
      const chars = [...seg.text].map((ch, ci) => {
        if (ch === " ") return " ";
        seen += 1;
        const on = !active || seen <= typed;
        return (
          <span key={ci} className={on ? styles.chIn : styles.ch}>
            {ch}
          </span>
        );
      });
      return seg.em ? <em key={si}>{chars}</em> : <span key={si}>{chars}</span>;
    });

  return (
    <section className={styles.hero} aria-roledescription="carousel" aria-label="IP6 Original">
      {SLIDES.map((s, i) => {
        const active = i === cur;
        seen = 0;
        return (
          <div
            key={s.src}
            className={[styles.slide, active ? styles.on : "", active && revealed ? styles.reveal : ""].join(" ")}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={!active}
          >
            <div className={styles.ph}>
              {/* Plain img: the slides are full-bleed covers with a hand-set focal point. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} style={{ objectPosition: s.pos }} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
            </div>
            <div className={styles.shadow} />
            <div className={styles.light} />
            <div className={styles.dim} />
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{s.eyebrow}</p>
              {i === 0 ? (
                <h1 className={styles.line}>{renderLine(s, active)}</h1>
              ) : (
                <p className={styles.line} aria-level={1} role="heading">{renderLine(s, active)}</p>
              )}
              <Link href={ctaHref} className={styles.cta} tabIndex={active ? 0 : -1}>
                Pre-order IP6 Original · 15% off
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        );
      })}

      <div className={styles.dots}>
        {SLIDES.map((s, i) => (
          <button key={s.src} type="button" className={i === cur ? styles.dotOn : styles.dot} aria-label={`Go to slide ${i + 1}`} aria-current={i === cur} onClick={() => goTo(i)} />
        ))}
      </div>
      <button type="button" className={styles.pause} aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={togglePause}>
        <PauseIcon paused={paused} />
      </button>
      <div className={styles.scroll} aria-hidden>
        Scroll
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4v16m0 0 6-6m-6 6-6-6" /></svg>
      </div>
    </section>
  );
}

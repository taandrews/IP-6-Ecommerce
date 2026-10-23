"use client";

import Link from "next/link";
import { asset } from "@/lib/assets";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./HeroSlideshow.module.css";

/* Full-bleed photo slideshow. Each slide opens under a navy-to-cyan duotone while the
   headline types in letter by letter, then the tint lifts to reveal the colour photo.
   Every headline traces to the label, a Shopify setting, or copy already on the site. */

type Segment = { text: string; em?: boolean };
// A slide with `video` plays it muted on loop (src is then its poster frame). `cta` overrides the shared button.
// `msrc` is a portrait version for phones, used when the landscape crop cannot keep everyone in frame.
// `sub` is the one plain sentence that says what the product is.
type Slide = { src: string; msrc?: string; video?: string; pos: string; mpos?: string; alt: string; eyebrow: string; line: Segment[]; sub: string; mobileHeadlineOnly?: boolean; mobileLow?: boolean; mobileTopEyebrow?: boolean };

const SLIDES: Slide[] = [
  { src: asset("hero/video/ip6-hero-stock-804268291-poster.webp"), video: asset("hero/video/ip6-hero-stock-804268291.mp4"), pos: "50% 45%", mpos: "50% 50%", alt: "Six children in a circle looking down at the camera and laughing", eyebrow: "Pre-order, ships November 2026", line: [{ text: "Pre-order now. " }, { text: "15% off.", em: true }], sub: "IP6 Original is a dietary supplement of IP6 and Inositol in vegetable capsules, formulated by the scientist who pioneered the research." },
  { src: asset("hero/ip6-hero-5.webp"), msrc: asset("hero/ip6-hero-5-m.webp"), pos: "55% 30%", mpos: "52% 88%", alt: "A woman meditating cross-legged on a yoga mat in a bright living room", eyebrow: "Pre-order, ships November 2026", line: [{ text: "Pre-order now. " }, { text: "15% off.", em: true }], sub: "IP6 Original is a dietary supplement of IP6 and Inositol in vegetable capsules, formulated by the scientist who pioneered the research." , mobileHeadlineOnly: true, mobileLow: true},
  { src: asset("hero/video/ip6-hero-dog-cat-poster.webp"), video: asset("hero/video/ip6-hero-dog-cat.mp4"), pos: "50% 0%", mpos: "62% 20%", alt: "A brown dog resting its head on a sleeping tabby cat on a blanket", eyebrow: "IP6 Original Pet Powder", line: [{ text: "IP6 Original, " }, { text: "for pets", em: true }, { text: "." }], sub: "The same IP6 and Inositol as an unflavored powder for dogs and cats, with a measuring scoop in the tub." , mobileHeadlineOnly: true},
  { src: asset("hero/ip6-hero-beach-couple.webp"), msrc: asset("hero/ip6-hero-beach-couple-m.webp"), pos: "62% 0%", mpos: "50% 72%", alt: "An older couple holding hands and playing at the water's edge on a sunny beach", eyebrow: "From the lab of Professor Shamsuddin, MD, PhD", line: [{ text: "There is only one " }, { text: "IP6 Original", em: true }, { text: "." }], sub: "IP6 and Inositol in vegetable capsules. Third-party tested and made in a cGMP-certified facility." , mobileHeadlineOnly: true, mobileLow: true},
  { src: asset("hero/ip6-hero-3.webp"), pos: "50% 8%", mpos: "70% 0%", alt: "A woman laughing in golden evening light, a visor on her head", eyebrow: "Professor AbulKalam M. Shamsuddin, MD, PhD", line: [{ text: "The man who researched IP6 " }, { text: "formulated it himself", em: true }, { text: "." }], sub: "Professor Shamsuddin researched IP6 at the University of Maryland School of Medicine and formulated IP6 Original to his own specification." , mobileTopEyebrow: true},
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

export function HeroSlideshow({ ctaHref, petHref }: { ctaHref: string; petHref?: string }) {
  const [cur, setCur] = useState(0);
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const timers = useRef<number[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
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

  // The active slide's video plays. When the show moves on, the video keeps
  // looping through the whole crossfade so it never freezes mid-fade; it is
  // paused only once its slide is fully hidden. Reduced motion keeps the poster.
  useEffect(() => {
    const pauses: number[] = [];
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === cur && !reduce) void v.play().catch(() => {});
      else pauses.push(window.setTimeout(() => v.pause(), 1200));
    });
    return () => pauses.forEach((t) => window.clearTimeout(t));
  }, [cur, reduce]);

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
      {/* Pictures: one per slide, crossfaded. */}
      {SLIDES.map((s, i) => {
        const active = i === cur;
        return (
          <div
            key={s.src}
            className={[styles.slide, i === 0 ? styles.slideCentered : "", active ? styles.on : "", active && revealed ? styles.reveal : ""].join(" ")}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={!active}
          >
            <div className={styles.ph}>
              {/* Plain img: the slides are full-bleed covers with a hand-set focal point. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.video ? (
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  src={s.video}
                  poster={s.src}
                  muted
                  loop
                  playsInline
                  preload={active ? "auto" : "none"}
                  aria-label={s.alt}
                  style={{ ["--pos" as string]: s.pos, ["--pos-m" as string]: s.mpos ?? s.pos }}
                />
              ) : s.msrc ? (
                <picture>
                  <source media="(max-width: 900px)" srcSet={s.msrc} />
                  <img src={s.src} alt={s.alt} style={{ ["--pos" as string]: s.pos, ["--pos-m" as string]: s.mpos ?? s.pos }} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                </picture>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt={s.alt} style={{ ["--pos" as string]: s.pos, ["--pos-m" as string]: s.mpos ?? s.pos }} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              )}
            </div>
            <div className={styles.shadow} />
            <div className={styles.light} />
            <div className={styles.dim} />
          </div>
        );
      })}

      {/* Words: every slide's text stacked in one cell, so the block never moves; only the active one shows. */}
      <div className={styles.copy}>
        <div className={styles.textStack}>
          {SLIDES.map((s, i) => {
            const active = i === cur;
            seen = 0;
            return (
              <div key={s.src} className={[styles.text, i === 0 ? styles.textCentered : "", s.mobileHeadlineOnly ? styles.headlineOnly : "", s.mobileLow ? styles.textLow : "", s.mobileTopEyebrow ? styles.textSplit : "", active ? styles.textOn : "", active && revealed ? styles.textReveal : ""].join(" ")} aria-hidden={!active}>
                <p className={styles.eyebrow}>{s.eyebrow}</p>
                {i === 0 ? (
                  <h1 className={styles.line}>{renderLine(s, active)}</h1>
                ) : (
                  <p className={styles.line} aria-level={1} role="heading">{renderLine(s, active)}</p>
                )}
                <p className={styles.sub}>{s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buttons: rendered once, so they stay put while the pictures change. */}
      <div className={styles.actions}>
        <Link href={ctaHref} className={styles.cta}>
          Pre-order IP6 Original · 15% off
          <ArrowRight aria-hidden />
        </Link>
        <nav className={styles.routes} aria-label="Shop by">
          <Link href={ctaHref}>For people</Link>
          {petHref ? <Link href={petHref}>For pets</Link> : null}
        </nav>
      </div>

      <div className={styles.dots}>
        {SLIDES.map((s, i) => (
          <button key={s.src} type="button" className={i === cur ? styles.dotOn : styles.dot} aria-label={`Go to slide ${i + 1}`} aria-current={i === cur} onClick={() => goTo(i)} />
        ))}
      </div>
      <button type="button" className={styles.pause} aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={togglePause}>
        <PauseIcon paused={paused} />
      </button>
    </section>
  );
}

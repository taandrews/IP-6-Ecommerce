"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Cinemagraph, type CinemagraphHandle } from "./Cinemagraph";
import { YOGA_ALT, YOGA_SOURCES } from "./heroCine";
import styles from "./HeroCinemagraph.module.css";

/* Version 1: the slideshow's duotone-and-type effect on a single photo. The still opens under the
   navy-to-cyan tint while the headline types in; on reveal the tint lifts and the cinemagraph
   clip starts, plays once, and holds its last frame. */

type Segment = { text: string; em?: boolean };

const EYEBROW = "From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD";
const LINE: Segment[] = [{ text: "There is only one " }, { text: "IP6 Original", em: true }, { text: "." }];

const TYPE_MS = 42;
const TYPE_DELAY = 500;
const REVEAL_AFTER_TYPED = 350;

const TOTAL = LINE.reduce((n, s) => n + s.text.replace(/ /g, "").length, 0);

function Icon({ state }: { state: "still" | "playing" | "paused" | "ended" }) {
  if (state === "playing") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>;
  if (state === "ended") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5" /></svg>;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 5v14l12-7z" /></svg>;
}

export function HeroCinemagraphTyped({ ctaHref }: { ctaHref: string }) {
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [vstate, setVstate] = useState<"still" | "playing" | "paused" | "ended">("still");
  const cine = useRef<CinemagraphHandle>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) {
      setTyped(TOTAL);
      setRevealed(true);
      return;
    }
    const timers: number[] = [];
    for (let k = 1; k <= TOTAL; k++) timers.push(window.setTimeout(() => setTyped(k), TYPE_DELAY + k * TYPE_MS));
    timers.push(window.setTimeout(() => setRevealed(true), TYPE_DELAY + TOTAL * TYPE_MS + REVEAL_AFTER_TYPED));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduce]);

  let seen = 0;
  const line = LINE.map((seg, si) => {
    const chars = [...seg.text].map((ch, ci) => {
      if (ch === " ") return " ";
      seen += 1;
      return (
        <span key={ci} className={seen <= typed ? styles.chIn : styles.ch}>
          {ch}
        </span>
      );
    });
    return seg.em ? <em key={si}>{chars}</em> : <span key={si}>{chars}</span>;
  });

  const label = vstate === "playing" ? "Pause animation" : vstate === "ended" ? "Replay animation" : "Play animation";

  return (
    <section className={[styles.hero, styles.on, revealed ? styles.reveal : ""].join(" ")} aria-label="IP6 Original">
      <Cinemagraph ref={cine} className={styles.ph} sources={YOGA_SOURCES} alt={YOGA_ALT} play={revealed} still={reduce} onStateChange={setVstate} />
      <div className={styles.shadow} />
      <div className={styles.light} />
      <div className={styles.dim} />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{EYEBROW}</p>
        <h1 className={styles.line}>{line}</h1>
        <Link href={ctaHref} className={styles.cta}>
          Pre Order Now
          <ArrowRight aria-hidden />
        </Link>
      </div>
      {!reduce && (
        <button type="button" className={styles.pause} aria-label={label} onClick={() => cine.current?.toggle()}>
          <Icon state={vstate} />
        </button>
      )}
      <div className={styles.scroll} aria-hidden>
        Scroll
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4v16m0 0 6-6m-6 6-6-6" /></svg>
      </div>
    </section>
  );
}

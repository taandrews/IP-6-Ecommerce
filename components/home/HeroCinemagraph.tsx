"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Cinemagraph, type CinemagraphHandle } from "./Cinemagraph";
import { YOGA_ALT, YOGA_SOURCES } from "./heroCine";
import styles from "./HeroCinemagraph.module.css";

/* Version 2: no tint, no typing. The colour still is on screen from the first paint, the
   cinemagraph clip starts as soon as it can, plays once and holds its last frame. Copy is static. */

const EYEBROW = "From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD";

function Icon({ state }: { state: "still" | "playing" | "paused" | "ended" }) {
  if (state === "playing") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>;
  if (state === "ended") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5" /></svg>;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 5v14l12-7z" /></svg>;
}

export function HeroCinemagraph({ ctaHref }: { ctaHref: string }) {
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

  const label = vstate === "playing" ? "Pause animation" : vstate === "ended" ? "Replay animation" : "Play animation";

  return (
    <section className={[styles.hero, styles.plain].join(" ")} aria-label="IP6 Original">
      <Cinemagraph ref={cine} className={styles.ph} sources={YOGA_SOURCES} alt={YOGA_ALT} play still={reduce} onStateChange={setVstate} />
      <div className={styles.dim} />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{EYEBROW}</p>
        <h1 className={styles.line}>
          There is only one <em>IP6 Original</em>.
        </h1>
        <Link href={ctaHref} className={styles.cta}>
          Pre-order IP6 Original · 15% off
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { PetHero } from "@/components/product/PetHero";
import { SupplementHero } from "@/components/product/SupplementHero";
import styles from "./ShopHero.module.css";

export function ShopHero() {
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const href = slide === 0 ? "#people" : "#pets";

  // Respect reduced motion; otherwise advance only when each video has finished.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);
  const playing = !paused && step < 2;
  const finishVideo = () => {
    if (step >= 2) return;
    setSlide(step === 0 ? 1 : 0);
    setStep(step + 1);
  };

  return <section className={styles.carousel} data-audience={slide === 0 ? "people" : "pets"} aria-label="Shop product highlights" aria-roledescription="carousel">
    <div id="shop-hero-slide" role="group" aria-roledescription="slide" aria-label={`${slide + 1} of 2: ${slide === 0 ? "For people" : "For pets"}`}>
      {slide === 0 ? <SupplementHero showCopy={false} playing={playing} loop={false} onEnded={finishVideo} /> : <PetHero showCopy={false} playing={playing} loop={false} onEnded={finishVideo} />}
      <div key={slide} className={styles.copy}>
        <p className={styles.eyebrow}>{slide === 0 ? "Capsules for people" : "Powder for dogs & cats"}</p>
        <h2>IP6 Original.<span>{slide === 0 ? "For you." : "For them."}</span></h2>
      </div>
      <div className={styles.actions}>
        <Link href={href} className={styles.order}>Pre Order Now<ArrowRight size={16} aria-hidden="true" /></Link>
        <nav className={styles.routes} aria-label="Shop by"><Link href="#people">For people</Link><Link href="#pets">For pets</Link></nav>
      </div>
      <div className={styles.dots}>
        {[0, 1].map(index => <button key={index} type="button" aria-label={`Go to slide ${index + 1}`} aria-current={slide === index} onClick={() => { setSlide(index); setStep(2); }}><span /></button>)}
      </div>
      <button type="button" className={styles.pause} aria-label={paused || step >= 2 ? "Play slideshow" : "Pause slideshow"} onClick={() => { if (step >= 2) { setStep(0); setSlide(0); setPaused(false); } else setPaused(!paused); }}>{paused || step >= 2 ? <Play size={22} /> : <Pause size={22} />}</button>
    </div>
  </section>;
}

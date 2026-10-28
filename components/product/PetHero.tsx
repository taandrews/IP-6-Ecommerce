"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { SHOP_VIDEO } from "@/lib/cdn-images";
import styles from "./PetHero.module.css";

export function PetHero({ ctaHref = "#pet-purchase", showCopy = true, playing = true, loop = true, onEnded }: { ctaHref?: string; showCopy?: boolean; playing?: boolean; loop?: boolean; onEnded?: () => void } = {}) {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => {});
    else video.pause();
  }, [playing]);
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const fit = () => {
      const top = hero.getBoundingClientRect().top + window.scrollY;
      const disclaimer = document.querySelector('aside.fixed[aria-label="FDA disclaimer"]');
      const bottom = disclaimer?.getBoundingClientRect().height ?? 0;
      hero.style.setProperty("--pet-visible-height", `${Math.max(0, (window.visualViewport?.height ?? window.innerHeight) - top - bottom - 1)}px`);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(hero);
    for (const el of document.querySelectorAll('body > header, [aria-label="Announcement"], aside.fixed[aria-label="FDA disclaimer"]')) observer.observe(el);
    fit();
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);
  return <section ref={heroRef} className={styles.hero} aria-label="IP6 Original for dogs and cats">
    <video ref={videoRef} className={styles.video} autoPlay={playing} muted loop={loop} onEnded={onEnded} playsInline controls={false} disablePictureInPicture preload="auto" poster={SHOP_VIDEO.pets.poster} width={1920} height={1080} aria-label="Two dogs and a cat together against a golden background">
      <source src={SHOP_VIDEO.pets.video} type="video/mp4" />
    </video>
    <div className={styles.shade} aria-hidden="true" />
    {showCopy && <div className={styles.copy}>
      <h2>IP6 Original for pets.</h2>
      <p>Unflavored IP6 and Inositol powder for dogs and cats.</p>
      <a className={styles.cta} href={ctaHref}>Pre Order Now<ArrowRight size={18} aria-hidden="true" /></a>
    </div>}
  </section>;
}

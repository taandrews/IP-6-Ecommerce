"use client";

import Image from "next/image";
import { asset } from "@/lib/assets";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./CampaignHero.module.css";

export function DaylightScene() {
  const scene = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = useRef(true);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const element = scene.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = preference.matches;
    setReduced(reduce);
    let active = true;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let time = 4.7;
    let renderer: Awaited<ReturnType<typeof import("./product-cinematography").createProductCinematography>> | undefined;

    const render = (seconds: number, moving: boolean) => {
      const shot = renderer?.render(seconds, moving);
      if (!shot) return;
      element.style.setProperty("--camera-scale", String(shot.scale));
      element.style.setProperty("--camera-origin", `${shot.originX * 100}% ${shot.originY * 100}%`);
    };

    const draw = (now: number) => {
      frame = 0;
      if (!active || !renderer || !visible || document.hidden || reduce || !playing.current) {
        previous = 0;
        return;
      }
      time += previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now;
      render(time, true);
      frame = requestAnimationFrame(draw);
    };
    const resume = () => { if (!frame && active) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const anchor = renderer?.resize();
      if (anchor) {
        element.style.setProperty("--bottle-left", `${anchor.left * 100}%`);
        element.style.setProperty("--bottle-top", `${anchor.top * 100}%`);
      }
      render(time, !reduce);
    };
    const preferenceChanged = () => {
      reduce = preference.matches;
      setReduced(reduce);
      render(time, !reduce);
      resume();
    };
    const lost = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      renderer?.dispose();
      renderer = undefined;
      element.style.setProperty("--camera-scale", "1");
      setReady(false);
    };
    const visibility = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; resume(); });
    const sizes = new ResizeObserver(resize);
    visibility.observe(element);
    sizes.observe(element);
    preference.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", resume);
    element.addEventListener("campaign-playback", resume);
    surface.addEventListener("webglcontextlost", lost);

    import("./product-cinematography").then(async ({ createProductCinematography }) => {
      if (!active) return;
      const loaded = await createProductCinematography(surface);
      if (!active) { loaded.dispose(); return; }
      renderer = loaded;
      resize();
      render(time, !reduce);
      setReady(true);
      resume();
    }).catch(() => { if (active) setReady(false); });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      visibility.disconnect();
      sizes.disconnect();
      preference.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", resume);
      element.removeEventListener("campaign-playback", resume);
      surface.removeEventListener("webglcontextlost", lost);
      renderer?.dispose();
    };
  }, []);

  const toggle = () => {
    playing.current = !playing.current;
    setPaused(!playing.current);
    scene.current?.dispatchEvent(new Event("campaign-playback"));
  };

  return (
    <div ref={scene} className={styles.scene} data-ready={ready}>
      <div className={styles.fallback} style={{ backgroundImage: `url(${asset("campaign/daylight-studio.webp")})` }}>
        <Image className={styles.bottle} src={asset("products/supplement-real.png")} alt="IP6 Original, 120-capsule bottle" width={435} height={580} sizes="(max-width: 760px) 280px, 460px" priority />
      </div>
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <div className={styles.productNote}>
        {ready && !reduced && <button className={styles.playback} onClick={toggle} aria-label={paused ? "Play hero animation" : "Pause hero animation"}>{paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}</button>}
      </div>
    </div>
  );
}

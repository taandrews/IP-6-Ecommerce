"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

/* Still-to-video cinemagraph drawn through one canvas.
   The poster is painted first, then each video frame is painted into the same canvas, so the
   still and the video share one compositing path and there is no brightness step at handover.
   The clip plays once. On "ended" drawing stops and the last frame stays. */

export type CineSource = { video: string; poster: string; width: number; height: number; pos: [number, number] };
export type CineSources = { landscape: CineSource; portrait: CineSource };

export type CinemagraphHandle = {
  /** Pause while playing, resume while paused, replay once ended. Returns the new "playing" state. */
  toggle: () => boolean;
  state: () => "still" | "playing" | "paused" | "ended";
};

type Props = {
  sources: CineSources;
  /** Start playing (once). The clip never starts on its own before this is true. */
  play: boolean;
  /** Reduced-motion or user choice: show the still only. */
  still?: boolean;
  alt: string;
  className?: string;
  onStateChange?: (s: "still" | "playing" | "paused" | "ended") => void;
};

const PORTRAIT_QUERY = "(max-width: 900px) and (orientation: portrait)";

function drawCover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, cw: number, ch: number, pos: [number, number]) {
  const scale = Math.max(cw / sw, ch / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (cw - dw) * pos[0];
  const dy = (ch - dh) * pos[1];
  ctx.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh);
}

export const Cinemagraph = forwardRef<CinemagraphHandle, Props>(function Cinemagraph(
  { sources, play, still = false, alt, className, onStateChange },
  ref,
) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const poster = useRef<HTMLImageElement | null>(null);
  const raf = useRef(0);
  const stateRef = useRef<"still" | "playing" | "paused" | "ended">("still");
  const [portrait, setPortrait] = useState(false);
  const [ready, setReady] = useState(false);
  const src = portrait ? sources.portrait : sources.landscape;

  const setState = (s: typeof stateRef.current) => {
    stateRef.current = s;
    onStateChange?.(s);
  };

  // Pick the clip for the viewport. Only re-evaluated on orientation/width change.
  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_QUERY);
    setPortrait(mq.matches);
    const onChange = () => setPortrait(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Paint helpers. The canvas is sized to the box at device pixels (capped at 2x).
  const paint = (source: CanvasImageSource | null) => {
    const c = canvas.current;
    const box = wrap.current;
    if (!c || !box) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(box.clientWidth * dpr);
    const ch = Math.round(box.clientHeight * dpr);
    if (c.width !== cw || c.height !== ch) {
      c.width = cw;
      c.height = ch;
    }
    const ctx = c.getContext("2d");
    if (!ctx || !source) return;
    drawCover(ctx, source, src.width, src.height, cw, ch, src.pos);
  };

  // Load the poster and paint it as the first frame; repaint on resize.
  useEffect(() => {
    let alive = true;
    setReady(false);
    const img = new Image();
    img.decoding = "async";
    img.src = src.poster;
    img
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        poster.current = img;
        paint(img);
        setReady(true);
      });
    const ro = new ResizeObserver(() => {
      const v = video.current;
      const useVideo = v && stateRef.current !== "still" && v.readyState >= 2;
      paint(useVideo ? v : poster.current);
    });
    if (wrap.current) ro.observe(wrap.current);
    return () => {
      alive = false;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src.poster]);

  // Frame loop while the clip plays.
  const loop = () => {
    const v = video.current;
    if (!v) return;
    if (!v.paused && !v.ended) {
      paint(v);
      raf.current = requestAnimationFrame(loop);
    }
  };

  const start = () => {
    const v = video.current;
    if (!v) return;
    v.play().then(
      () => {
        setState("playing");
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(loop);
      },
      () => {
        // Autoplay refused: stay on the still.
        setState("still");
      },
    );
  };

  // Play once when asked. Never restarts by itself after "ended".
  useEffect(() => {
    if (!play || still || !ready) return;
    if (stateRef.current !== "still") return;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, still, ready]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onEnded = () => {
      cancelAnimationFrame(raf.current);
      paint(v); // keep the last frame
      setState("ended");
    };
    const onPause = () => {
      if (!v.ended && stateRef.current === "playing") setState("paused");
    };
    v.addEventListener("ended", onEnded);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("pause", onPause);
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src.video]);

  useImperativeHandle(ref, () => ({
    state: () => stateRef.current,
    toggle: () => {
      const v = video.current;
      if (!v || still) return false;
      const s = stateRef.current;
      if (s === "playing") {
        v.pause();
        cancelAnimationFrame(raf.current);
        setState("paused");
        return false;
      }
      if (s === "ended") {
        v.currentTime = 0; // explicit replay request from the user
      }
      start();
      return true;
    },
  }));

  // Until the canvas has painted the poster, the same JPEG sits behind it as a CSS background so
  // the first paint of the page already shows the photo (the fetch starts from the server HTML).
  const bg = ready
    ? undefined
    : { backgroundImage: `url(${src.poster})`, backgroundSize: "cover", backgroundPosition: `${src.pos[0] * 100}% ${src.pos[1] * 100}%` };

  return (
    <div ref={wrap} className={className} role="img" aria-label={alt} style={bg}>
      <canvas ref={canvas} style={{ width: "100%", height: "100%", display: "block" }} />
      {!still && (
        <video
          key={src.video}
          ref={video}
          muted
          playsInline
          preload="metadata"
          src={src.video}
          aria-hidden
          tabIndex={-1}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      )}
    </div>
  );
});

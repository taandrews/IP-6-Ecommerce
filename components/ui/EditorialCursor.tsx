"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor for editorial pages. A small ink-dot follower with a delayed
 * ring; the ring enlarges and reads a label when hovering over data-cursor
 * elements (e.g. data-cursor="View" on an image).
 *
 * Mount once per page that opts in. No effect on touch devices.
 */
export function EditorialCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string>("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let ringX = 0,
      ringY = 0,
      targetX = 0,
      targetY = 0;
    let raf = 0;

    function tick() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function onMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      setVisible(true);
      const el = (e.target as HTMLElement).closest("[data-cursor]") as HTMLElement | null;
      setLabel(el?.dataset.cursor ?? "");
    }

    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.classList.add("editorial-cursor-active");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("editorial-cursor-active");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 z-[200] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="size-2 rounded-full bg-forest-800" />
      </div>
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 z-[200] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className={[
            "rounded-full border border-forest-700/30 grid place-items-center transition-all duration-200 ease-brand",
            label ? "size-20 bg-forest-800 border-forest-800 text-ivory-100" : "size-9",
          ].join(" ")}
        >
          {label ? (
            <span className="text-[10px] uppercase tracking-[0.22em] font-medium">
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}

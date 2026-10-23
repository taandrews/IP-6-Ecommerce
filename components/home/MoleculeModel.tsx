"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/assets";
import { IP6_ATOMS, IP6_BONDS, type Atom } from "@/content/molecule-ip6";

/**
 * Rotating ball-and-stick model of the IP6 molecule, drawn on a 2D canvas
 * with a small perspective projection. The still image shows until the first
 * frame is painted, and stays for reduced-motion users and when the canvas is
 * off screen. Same model and palette as the research site's hero.
 */

const STYLE: Record<Atom["element"], { radius: number; light: string; color: string; dark: string }> = {
  C: { radius: 0.38, light: "#a5adb6", color: "#39424c", dark: "#131b25" },
  H: { radius: 0.24, light: "#ffffff", color: "#e1e6ec", dark: "#8694a5" },
  O: { radius: 0.37, light: "#ffafa0", color: "#db342d", dark: "#811e1c" },
  P: { radius: 0.47, light: "#ffe3a0", color: "#e6a02b", dark: "#9b5812" },
};

// Centre the model on its centroid once.
const centroid = [0, 1, 2].map((k) => IP6_ATOMS.reduce((sum, a) => sum + (a.position[k] ?? 0), 0) / IP6_ATOMS.length);
const ATOMS = IP6_ATOMS.map((a) => ({ ...a, position: a.position.map((v, k) => v - (centroid[k] ?? 0)) as [number, number, number] }));
const BONDS = IP6_BONDS.map((b) => ({ from: ATOMS.findIndex((a) => a.id === b.from), to: ATOMS.findIndex((a) => a.id === b.to), order: b.order }));

export function MoleculeModel({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let yaw = 0.35;
    let pitch = -0.32;
    let clock = 0;
    let visible = true;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const scale = (Math.min(width, height) / 14.8) * (1 + 0.02 * Math.sin(clock / 6100));
      const roll = 0.3 * Math.sin(clock / 7300);
      const cx = width / 2 + Math.sin(clock / 4100) * width * 0.012;
      const cy = height / 2 + Math.sin(clock / 3300) * height * 0.02;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const cosR = Math.cos(roll), sinR = Math.sin(roll);

      const projected = ATOMS.map((a) => {
        const [x, y, z] = a.position;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        const persp = 34 / (34 - z2);
        return {
          x: cx + (x1 * cosR - y2 * sinR) * scale * persp,
          y: cy - (x1 * sinR + y2 * cosR) * scale * persp,
          z: z2,
          radius: STYLE[a.element].radius * scale * persp,
          element: a.element,
        };
      });
      const alphaFor = (z: number) => Math.min(1, Math.max(0.62, 0.92 + 0.055 * z));
      const layers: { z: number; paint: () => void }[] = [];

      for (const bond of BONDS) {
        const a = projected[bond.from], b = projected[bond.to];
        if (!a || !b) continue;
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
        for (let seg = 0; seg < 8; seg++) {
          const s0 = seg / 8, s1 = (seg + 1) / 8;
          const zMid = a.z + (b.z - a.z) * ((s0 + s1) / 2);
          layers.push({
            z: zMid,
            paint: () => {
              ctx.globalAlpha = alphaFor(zMid);
              for (let n = 0; n < bond.order; n++) {
                const off = bond.order === 2 ? (n === 0 ? -1 : 1) * scale * 0.085 : 0;
                ctx.beginPath();
                ctx.moveTo(a.x + (b.x - a.x) * s0 + nx * off, a.y + (b.y - a.y) * s0 + ny * off);
                ctx.lineTo(a.x + (b.x - a.x) * s1 + nx * off, a.y + (b.y - a.y) * s1 + ny * off);
                ctx.lineWidth = scale * (bond.order === 2 ? 0.095 : 0.145);
                ctx.lineCap = "round";
                ctx.strokeStyle = s0 < 0.5 ? STYLE[a.element].color : STYLE[b.element].color;
                ctx.stroke();
              }
            },
          });
        }
      }
      for (const p of projected) {
        layers.push({
          z: p.z,
          paint: () => {
            ctx.globalAlpha = alphaFor(p.z);
            const st = STYLE[p.element];
            const g = ctx.createRadialGradient(p.x - 0.35 * p.radius, p.y - 0.4 * p.radius, 0.05 * p.radius, p.x, p.y, p.radius);
            g.addColorStop(0, st.light);
            g.addColorStop(0.5, st.color);
            g.addColorStop(1, st.dark);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
          },
        });
      }
      layers.sort((p, q) => p.z - q.z).forEach((l) => l.paint());
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (last) {
        const dt = Math.min(now - last, 64);
        yaw += (dt * Math.PI * 2) / 12000;
        pitch += (dt * Math.PI * 2) / 29000;
        clock += dt;
      }
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      last = 0;
      draw();
      if (!reduce.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };

    const sizer = new ResizeObserver(() => {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
      setReady(true);
    });
    const watcher = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      restart();
    });
    sizer.observe(canvas);
    watcher.observe(canvas);
    reduce.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    restart();
    return () => {
      cancelAnimationFrame(frame);
      sizer.disconnect();
      watcher.disconnect();
      reduce.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);

  return (
    <div className={`relative w-full ${className ?? ""}`} style={{ aspectRatio: "1 / 1" }} data-ready={ready}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("brand/ip6-molecule.png")}
        alt="Molecular model of IP6 with six phosphate groups"
        width={1790}
        height={2000}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ visibility: ready ? "hidden" : "visible" }}
        aria-hidden={ready}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Three-dimensional molecular model of IP6, rotating to show its inositol ring and six phosphate groups"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}

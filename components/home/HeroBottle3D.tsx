"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./HeroBottle.module.css";

/**
 * Real-time 3D bottle built from the client's actual label print file wrapped
 * on a cylinder, with a glossy black cap and body and studio reflections.
 * Rotates slowly on its own, turns with the pointer, and scrubs with scroll so
 * the back of the label is revealed as the reader moves down the page.
 * Under reduced motion it renders one still frame.
 */

const LABEL_URL = "/products/ip6-label.jpg";
/* Front panel centre as a fraction of the label width (left panel of the print). */
const FRONT_CENTRE = 0.18;

export function HeroBottle3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 10, 1000);
    camera.position.set(0, 58, 340);
    camera.lookAt(0, 52, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(makeStudio(), 0.02).texture;

    const key = new THREE.DirectionalLight(0xfff3dc, 1.6);
    key.position.set(-140, 200, 180);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe8c977, 1.1);
    rim.position.set(170, 80, -140);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));

    const bottle = new THREE.Group();
    scene.add(bottle);

    /* Dimensions in millimetres. Label print is 180 x 70 mm, so the body
       circumference is 180 mm and the radius 28.65 mm. */
    const R = 28.65;
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      reflectivity: 0.8,
      envMapIntensity: 0.7,
    });
    const capMat = new THREE.MeshPhysicalMaterial({
      color: 0x05080f,
      roughness: 0.4,
      metalness: 0.1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.6,
    });

    /* Body with a rounded base and shoulder, built as a lathe profile. */
    const profile: THREE.Vector2[] = [];
    const push = (r: number, y: number) => profile.push(new THREE.Vector2(r, y));
    push(0, 0);
    push(R * 0.82, 0);
    push(R * 0.97, 2.5);
    push(R, 6);
    push(R, 76);
    push(R * 0.99, 80);
    push(R * 0.95, 84);
    push(R * 0.88, 87.5);
    push(R * 0.8, 90);
    push(R * 0.76, 92);
    push(R * 0.76, 94);
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), bodyMat);
    bottle.add(body);

    /* Cap with a slight bevel and fine ridges. */
    const capProfile: THREE.Vector2[] = [];
    const cp = (r: number, y: number) => capProfile.push(new THREE.Vector2(r, y));
    cp(R * 0.76, 94);
    cp(R * 0.86, 94);
    cp(R * 0.86, 95.5);
    cp(R * 0.86, 108);
    cp(R * 0.82, 109.5);
    cp(R * 0.5, 110);
    cp(0, 110);
    const cap = new THREE.Mesh(new THREE.LatheGeometry(capProfile, 96), capMat);
    bottle.add(cap);
    const ridges = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.865, R * 0.865, 10, 96, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, roughness: 0.55, clearcoat: 0.3 }),
    );
    ridges.position.y = 102;
    bottle.add(ridges);

    /* Label: an open cylinder a hair wider than the body, 70 mm tall. */
    const labelGeo = new THREE.CylinderGeometry(R + 0.12, R + 0.12, 70, 128, 1, true);
    const labelMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.55,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = 6 + 35;
    bottle.add(label);

    new THREE.TextureLoader().load(LABEL_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      /* Put the front panel centre at the front (u = 0 faces the camera).
         CylinderGeometry runs u from left to right as seen from outside. */
      tex.offset.x = FRONT_CENTRE;
      labelMat.map = tex;
      labelMat.needsUpdate = true;
      renderOnce();
    });

    /* Ground contact shadow as a soft disc. */
    const shadowTex = makeShadowTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(R * 4.2, R * 4.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.2;
    scene.add(shadow);

    /* Motion state. */
    let targetX = 0;
    let targetTilt = 0;
    let pointerX = 0;
    let pointerTilt = 0;
    let scrollRot = 0;
    let auto = 0.35;
    let raf = 0;
    let last = performance.now();
    let visible = true;

    const area: HTMLElement = mount.closest("section") ?? mount;
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 1.1;
      targetTilt = ((e.clientY - r.top) / r.height - 0.5) * 0.18;
    };
    const onLeave = () => {
      targetX = 0;
      targetTilt = 0;
    };
    const onScroll = () => {
      scrollRot = Math.min(window.scrollY, 1200) * 0.0038;
    };

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(() => {
      resize();
      renderOnce();
    });
    ro.observe(mount);
    resize();

    function renderOnce() {
      bottle.rotation.y = auto + pointerX + scrollRot;
      bottle.rotation.x = pointerTilt;
      renderer.render(scene, camera);
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      auto += dt * 0.22;
      pointerX += (targetX - pointerX) * 0.06;
      pointerTilt += (targetTilt - pointerTilt) * 0.06;
      renderOnce();
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(mount);

    if (!reduce) {
      if (window.matchMedia("(pointer: fine)").matches) {
        area.addEventListener("pointermove", onMove);
        area.addEventListener("pointerleave", onLeave);
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      raf = requestAnimationFrame(tick);
    } else {
      renderOnce();
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      pmrem.dispose();
      renderer.dispose();
      labelGeo.dispose();
      body.geometry.dispose();
      cap.geometry.dispose();
      ridges.geometry.dispose();
      shadowTex.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={styles.stage}>
      <div ref={mountRef} className={styles.gl} aria-label="IP6 Original Supplement bottle, navy and gold label, formulated by Prof. AbulKalam M. Shamsuddin, MD, PhD." role="img" />
    </div>
  );
}

/* A simple photo studio: large soft panels instead of a lit room, so the
   glossy body shows long vertical highlights rather than blotches. */
function makeStudio() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x1a1f29);
  const panel = (w: number, h: number, color: number, intensity: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    (m.material as THREE.MeshBasicMaterial).color.multiplyScalar(intensity);
    m.position.set(...pos);
    m.lookAt(...look);
    env.add(m);
  };
  panel(260, 900, 0xfff4e0, 7, [-420, 300, 260], [0, 60, 0]);
  panel(140, 900, 0xe9d9b0, 4, [460, 240, -60], [0, 60, 0]);
  panel(700, 300, 0xffffff, 2.5, [0, 620, 0], [0, 0, 0]);
  panel(900, 900, 0x9aa3ad, 0.6, [0, -400, 0], [0, 0, 0]);
  return env;
}

function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  g.addColorStop(0, "rgba(0, 24, 56, 0.55)");
  g.addColorStop(0.45, "rgba(0, 24, 56, 0.22)");
  g.addColorStop(1, "rgba(0, 24, 56, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

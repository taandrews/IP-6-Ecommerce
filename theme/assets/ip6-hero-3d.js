/* IP6 Original hero: real-time 3D bottle built from the label print file.
   Mirrors components/home/HeroBottle3D.tsx on the Next.js stack.
   Loaded as an ES module; three.js comes from the jsDelivr CDN. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const FRONT_CENTRE = 0.18;

function makeStudio() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x1a1f29);
  const panel = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.material.color.multiplyScalar(intensity);
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
  const ctx = c.getContext("2d");
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

export function mountHeroBottle(mount, labelUrl) {
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

  const R = 28.65;
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x050c18, roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.18, reflectivity: 0.8, envMapIntensity: 0.7 });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0x05080f, roughness: 0.4, metalness: 0.1, clearcoat: 0.7, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });

  const profile = [];
  const push = (r, y) => profile.push(new THREE.Vector2(r, y));
  push(0, 0); push(R * 0.82, 0); push(R * 0.97, 2.5); push(R, 6); push(R, 76); push(R * 0.99, 80); push(R * 0.95, 84); push(R * 0.88, 87.5); push(R * 0.8, 90); push(R * 0.76, 92); push(R * 0.76, 94);
  bottle.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 96), bodyMat));

  const capProfile = [];
  const cp = (r, y) => capProfile.push(new THREE.Vector2(r, y));
  cp(R * 0.76, 94); cp(R * 0.86, 94); cp(R * 0.86, 95.5); cp(R * 0.86, 108); cp(R * 0.82, 109.5); cp(R * 0.5, 110); cp(0, 110);
  bottle.add(new THREE.Mesh(new THREE.LatheGeometry(capProfile, 96), capMat));
  const ridges = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.865, R * 0.865, 10, 96, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, roughness: 0.55, clearcoat: 0.3 }));
  ridges.position.y = 102;
  bottle.add(ridges);

  const labelMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.35, envMapIntensity: 0.55 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.12, R + 0.12, 70, 128, 1, true), labelMat);
  label.position.y = 41;
  bottle.add(label);

  new THREE.TextureLoader().load(labelUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.offset.x = FRONT_CENTRE;
    labelMat.map = tex;
    labelMat.needsUpdate = true;
    renderOnce();
  });

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(R * 4.2, R * 4.2), new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.2;
  scene.add(shadow);

  let targetX = 0, targetTilt = 0, pointerX = 0, pointerTilt = 0, scrollRot = 0, auto = 0.35, last = performance.now(), visible = true;
  const area = mount.closest("section") || mount;

  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(() => { resize(); renderOnce(); }).observe(mount);
  resize();

  function renderOnce() {
    bottle.rotation.y = auto + pointerX + scrollRot;
    bottle.rotation.x = pointerTilt;
    renderer.render(scene, camera);
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    auto += dt * 0.22;
    pointerX += (targetX - pointerX) * 0.06;
    pointerTilt += (targetTilt - pointerTilt) * 0.06;
    renderOnce();
  }

  new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); }).observe(mount);

  if (reduce) { renderOnce(); return; }
  if (window.matchMedia("(pointer: fine)").matches) {
    area.addEventListener("pointermove", (e) => {
      const r = area.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 1.1;
      targetTilt = ((e.clientY - r.top) / r.height - 0.5) * 0.18;
    });
    area.addEventListener("pointerleave", () => { targetX = 0; targetTilt = 0; });
  }
  const onScroll = () => { scrollRot = Math.min(window.scrollY, 1200) * 0.0038; };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  requestAnimationFrame(tick);
}

for (const el of document.querySelectorAll("[data-hero-3d]")) {
  mountHeroBottle(el, el.getAttribute("data-hero-3d"));
}

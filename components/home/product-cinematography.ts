import * as THREE from "three";
import { asset } from "@/lib/assets";

const smooth = (value: number) => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };
const mix = THREE.MathUtils.lerp;

export async function createProductCinematography(canvas: HTMLCanvasElement) {
  const label = await new THREE.TextureLoader().loadAsync(asset("campaign/ip6-supplied-label.webp"));
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (error) {
    label.dispose();
    throw error;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 3.45, -3.45, .1, 100);
  camera.position.set(0, 1.4, 14);
  camera.lookAt(0, 0, 0);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [label];
  const geometry = <T extends THREE.BufferGeometry>(value: T) => { geometries.push(value); return value; };
  const material = <T extends THREE.Material>(value: T) => { materials.push(value); return value; };

  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x7c8791);
  const cardGeometry = new THREE.PlaneGeometry(1, 1);
  const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  for (const [x, y, z, width, height] of [[-4, 4, 5, 3, 8], [5, 3, 1, 2, 7], [1, 7, -4, 7, 4], [0, 2, 7, 3, 5]]) {
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(x!, y!, z!);
    card.scale.set(width!, height!, 1);
    card.lookAt(0, 2, 0);
    studio.add(card);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .035);
  scene.environment = environment.texture;
  cardGeometry.dispose(); cardMaterial.dispose(); pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xeaf3ff, .85));
  const key = new THREE.DirectionalLight(0xfffcf5, 3);
  key.position.set(-4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 7; key.shadow.camera.bottom = -3;
  key.shadow.normalBias = .015;
  key.shadow.bias = -.0001;
  key.shadow.radius = 5;
  scene.add(key);
  const edge = new THREE.DirectionalLight(0xd9eaff, 1.8);
  edge.position.set(4, 4, -4);
  scene.add(edge);

  label.colorSpace = THREE.SRGBColorSpace;
  label.wrapS = THREE.RepeatWrapping;
  label.offset.x = (638 - 6) / 1522;
  label.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = label.image.width;
  maskCanvas.height = label.image.height;
  const context = maskCanvas.getContext("2d")!;
  context.drawImage(label.image, 0, 0);
  const pixels = context.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  for (let p = 0; p < pixels.data.length; p += 4) {
    const gold = pixels.data[p]! > pixels.data[p + 2]! * 1.35 && pixels.data[p + 1]! > 60;
    const value = gold ? 230 : 8;
    pixels.data[p] = value; pixels.data[p + 1] = value; pixels.data[p + 2] = value;
  }
  context.putImageData(pixels, 0, 0);
  const foil = new THREE.CanvasTexture(maskCanvas);
  foil.wrapS = THREE.RepeatWrapping;
  foil.offset.copy(label.offset);
  textures.push(foil);
  const plastic = material(new THREE.MeshPhysicalMaterial({ color: 0x030a17, roughness: .24, metalness: .12, clearcoat: .8, clearcoatRoughness: .19, envMapIntensity: 1.35 }));
  const capPlastic = material(new THREE.MeshPhysicalMaterial({ color: 0x020713, roughness: .31, metalness: .08, clearcoat: .45, envMapIntensity: 1 }));
  const print = material(new THREE.MeshStandardMaterial({ map: label, roughness: .4, metalness: .7, metalnessMap: foil, envMapIntensity: 1.1 }));

  const pivot = new THREE.Group();
  pivot.position.y = 1.75;
  scene.add(pivot);
  const bottle = new THREE.Group();
  bottle.position.y = -1.75;
  pivot.add(bottle);
  const points = [
    [0, .045], [.72, .045], [.87, .05], [.95, .075], [.985, .12], [1, .19],
    [1, .35], [1, 2.66], [.997, 2.74], [.98, 2.81], [.94, 2.88], [.88, 2.94],
    [.80, 2.99], [.73, 3.025], [.69, 3.07], [.685, 3.13], [.685, 3.23], [0, 3.23],
  ].map(([r, y]) => new THREE.Vector2(r!, y!));
  const profile = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(point.x, point.y, 0)), false, "centripetal");
  const smoothProfile = profile.getPoints(160).map(point => new THREE.Vector2(Math.max(0, point.x), point.y));
  const body = new THREE.Mesh(geometry(new THREE.LatheGeometry(smoothProfile, 192)), plastic);
  body.castShadow = true;
  bottle.add(body);
  const labelMesh = new THREE.Mesh(geometry(new THREE.CylinderGeometry(1.003, 1.003, 2.54, 192, 1, true)), print);
  labelMesh.position.y = 1.46;
  labelMesh.castShadow = true;
  bottle.add(labelMesh);

  const capPoints = [[0, 3.55], [.70, 3.55], [.765, 3.545], [.79, 3.52], [.795, 3.49], [.795, 3.20], [.78, 3.17], [.73, 3.16], [0, 3.16]].map(([r, y]) => new THREE.Vector2(r!, y!));
  const cap = new THREE.Mesh(geometry(new THREE.LatheGeometry(capPoints.reverse(), 192)), capPlastic);
  cap.castShadow = true;
  bottle.add(cap);
  const flutes = new THREE.InstancedMesh(geometry(new THREE.BoxGeometry(.012, .287, .022)), capPlastic, 144);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 144; i++) {
    const angle = i / 144 * Math.PI * 2;
    dummy.position.set(Math.sin(angle) * .797, 3.365, Math.cos(angle) * .797);
    dummy.rotation.set(0, angle, 0);
    dummy.updateMatrix();
    flutes.setMatrixAt(i, dummy.matrix);
  }
  flutes.castShadow = true;
  bottle.add(flutes);
  for (const [radius, height] of [[.785, 3.19], [.69, 3.11], [.98, .15]]) {
    const seam = new THREE.Mesh(geometry(new THREE.TorusGeometry(radius!, .012, 8, 192)), plastic);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = height!;
    bottle.add(seam);
  }

  const floor = new THREE.Mesh(geometry(new THREE.PlaneGeometry(200, 200)), material(new THREE.ShadowMaterial({ color: 0x183b55, opacity: .22 })));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.position.y = .02;
  scene.add(floor);

  let width = 1;
  let height = 1;
  let anchorX = .735;
  let anchorY = .69;
  let lastTime = 0;
  let lastMoving = true;
  let disposed = false;
  let previousPose = "";
  let compactDesktop = false;

  function render(seconds: number, moving: boolean) {
    if (disposed) return;
    lastTime = seconds; lastMoving = moving;
    const t = moving ? seconds % 8 : 3;
    let zoom = 1;
    let yaw = 0;
    let roll = 0;
    let pitch = 0;
    if (t < 1.6) {
      const progress = smooth(t / 1.6);
      zoom = mix(2.25, 1, progress);
      yaw = mix(-.55, 0, progress);
      roll = mix(-.35, 0, progress);
      pitch = mix(.04, 0, progress);
    } else if (t > 4.7 && t < 6.2) {
      const progress = smooth((t - 4.7) / 1.5);
      yaw = Math.PI * 2 * progress;
      roll = -.22 * Math.sin(progress * Math.PI);
      zoom = 1 + .12 * Math.sin(progress * Math.PI);
    } else if (t >= 6.2) {
      const progress = smooth((t - 6.2) / 1.8);
      zoom = mix(1, 2.25, progress);
      yaw = Math.PI * 2 + mix(0, -.55, progress);
      roll = mix(0, -.35, progress);
      pitch = mix(0, .04, progress);
    }
    if (compactDesktop) zoom = 1 + (zoom - 1) * .52;
    const pose = `${zoom}:${yaw}:${roll}:${pitch}`;
    const shot = { scale: zoom, originX: anchorX, originY: anchorY - .38 };
    if (pose === previousPose) return shot;
    previousPose = pose;
    pivot.rotation.set(pitch, yaw, roll, "YXZ");
    pivot.position.y = 1.75 * Math.cos(roll) + Math.abs(Math.sin(roll));
    // A real camera move maintains the focal point as the label fills the frame.
    const viewY = anchorY + (zoom - 1) * .38;
    camera.zoom = zoom;
    camera.setViewOffset(width, height, -(anchorX - .5) * width, -(viewY - .5) * height, width, height);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return shot;
  }

  return {
    render,
    resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const imageAspect = 1672 / 941;
      const coverX = Math.min(1, aspect / imageAspect);
      const coverY = Math.min(1, imageAspect / aspect);
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      compactDesktop = !mobile && aspect < 1.4;
      const focusX = mobile ? .735 : .5;
      anchorX = Math.min(.77, (.735 - focusX) / coverX + .5);
      anchorY = (.69 - .5) / coverY + .5;
      camera.left = -3.45 * aspect; camera.right = 3.45 * aspect;
      previousPose = "";
      render(lastTime, lastMoving);
      return { left: anchorX, top: anchorY - .68 * .886 };
    },
    dispose() {
      disposed = true;
      for (const item of geometries) item.dispose();
      for (const item of materials) item.dispose();
      for (const item of textures) item.dispose();
      flutes.dispose();
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
    },
  };
}

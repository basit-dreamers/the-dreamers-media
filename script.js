// The Dreamers Media — 3D Immersive Experience
import * as THREE from 'three';

/* =========================================================
   THREE.JS SCENE
   ========================================================= */
const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05050a, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x05050a, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ===== Lights ===== */
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Hemisphere fill — sky/ground gradient for realistic PBR ambient
scene.add(new THREE.HemisphereLight(0xb0c4ff, 0x20102a, 0.5));

const keyLight = new THREE.PointLight(0xff6b9d, 3, 50);
keyLight.position.set(8, 6, 6);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x4facfe, 2.5, 50);
fillLight.position.set(-8, -4, 6);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xc44cf7, 2, 40);
rimLight.position.set(0, 0, -10);
scene.add(rimLight);

// Top studio light to rake the king's polished clearcoat
const studioLight = new THREE.DirectionalLight(0xffffff, 0.8);
studioLight.position.set(2, 10, 4);
scene.add(studioLight);

/* ===== Starfield ===== */
const starGeo = new THREE.BufferGeometry();
const starCount = 2500;
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const palette = [
  new THREE.Color(0xff6b9d),
  new THREE.Color(0xc44cf7),
  new THREE.Color(0x4facfe),
  new THREE.Color(0xffffff),
  new THREE.Color(0xfee140),
];
for (let i = 0; i < starCount; i++) {
  const r = 20 + Math.random() * 60;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  starPos[i*3+2] = r * Math.cos(phi);
  const c = palette[Math.floor(Math.random() * palette.length)];
  starColors[i*3] = c.r; starColors[i*3+1] = c.g; starColors[i*3+2] = c.b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  size: 0.12,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  sizeAttenuation: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
scene.add(stars);

/* ===== Shooting stars ===== */
const shootingStars = [];
const shootMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
for (let i = 0; i < 4; i++) {
  const geo = new THREE.CylinderGeometry(0.008, 0.002, 3.5, 6, 1, true);
  geo.translate(0, -1.75, 0);          // move tail behind the origin
  geo.rotateZ(Math.PI / 2);            // orient along +X
  const s = new THREE.Mesh(geo, shootMat.clone());
  s.material.opacity = 0;
  s.userData = {
    alive: false,
    t: 0,
    speed: 0,
    dir: new THREE.Vector3(),
  };
  scene.add(s);
  shootingStars.push(s);
}
function spawnShootingStar() {
  const s = shootingStars.find(x => !x.userData.alive);
  if (!s) return;
  // Random start on a sphere of radius ~30, far from camera target
  const r = 28;
  const theta = Math.random() * Math.PI * 2;
  const phi = 0.3 + Math.random() * 0.6;
  s.position.set(r * Math.sin(phi) * Math.cos(theta), 6 + Math.random() * 10, r * Math.sin(phi) * Math.sin(theta) - 20);
  const dir = new THREE.Vector3(-0.8 + Math.random() * 0.3, -0.5 - Math.random() * 0.3, 0.4 + Math.random() * 0.3).normalize();
  s.userData.dir.copy(dir);
  s.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  s.userData.alive = true;
  s.userData.t = 0;
  s.userData.speed = 22 + Math.random() * 18;
  s.material.opacity = 0;
}
let nextShootAt = 2;

/* ===== Dust particles (foreground ambient motion) ===== */
const dustCount = 220;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
const dustVel = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i*3]   = (Math.random() - 0.5) * 20;
  dustPos[i*3+1] = (Math.random() - 0.5) * 12;
  dustPos[i*3+2] = (Math.random() - 0.5) * 10 - 2;
  dustVel[i*3]   = (Math.random() - 0.5) * 0.01;
  dustVel[i*3+1] = (Math.random() - 0.5) * 0.01;
  dustVel[i*3+2] = (Math.random() - 0.5) * 0.005;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  sizeAttenuation: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
scene.add(dust);

/* ===== Central Object: 3D Chess King Piece ===== */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const logoGroup = new THREE.Group();
coreGroup.add(logoGroup);

// Legacy so downstream refs don't break
const logoMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.25, metalness: 0.9,
  emissive: 0xc44cf7, emissiveIntensity: 0.2,
});
const haloMatBase = new THREE.MeshBasicMaterial({
  color: 0xc44cf7, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const logoParts = [];

/* ---------- Materials — realistic polished obsidian/marble ---------- */
const kingMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a1a22,          // deep near-black like polished obsidian
  roughness: 0.22,
  metalness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  reflectivity: 0.6,
  sheen: 0.4,
  sheenColor: 0x6b5b8a,
  emissive: 0x000000,
  emissiveIntensity: 0,
});

// Subtle silver trim for the decorative bands — much more restrained
const trimMat = new THREE.MeshPhysicalMaterial({
  color: 0x8890a8,
  roughness: 0.25,
  metalness: 1,
  clearcoat: 0.7,
  clearcoatRoughness: 0.1,
});

// Globe materials — wireframe Earth on top of the king
const globeMat = new THREE.MeshPhysicalMaterial({
  color: 0x0a1428,
  roughness: 0.3,
  metalness: 0.6,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  transparent: true,
  opacity: 0.55,
});
const meridianMat = new THREE.MeshBasicMaterial({
  color: 0xc44cf7,
  transparent: true,
  opacity: 0.85,
});

// Pedestal stone material
const pedestalMat = new THREE.MeshPhysicalMaterial({
  color: 0x0e0e16,
  roughness: 0.45,
  metalness: 0.2,
  clearcoat: 0.5,
});

/* ---------- King body — refined Staunton lathe profile ---------- */
// Inner wrapper so the scroll-driven logoGroup.position lerp stays intact.
const kingWrapper = new THREE.Group();
kingWrapper.position.y = -1.4;
logoGroup.add(kingWrapper);

/*
 * Traditional Staunton silhouette (radius vs height) — smoother, more
 * realistic than the previous zig-zag version: wide tiered base, long
 * slender column, rounded collar, subtle neck narrowing into the crown.
 */
const profile = [
  [0.00, 0.00],
  [1.15, 0.00],
  [1.15, 0.05],
  [1.10, 0.10],
  [1.02, 0.16],
  [1.06, 0.20],
  [1.06, 0.28],
  [0.95, 0.35],
  [0.80, 0.45],
  [0.62, 0.60],
  [0.48, 0.80],
  [0.42, 1.05],
  [0.40, 1.35],
  [0.40, 1.65],
  [0.45, 1.80],
  [0.60, 1.92],
  [0.68, 2.00],
  [0.52, 2.07],
  [0.44, 2.15],
  [0.48, 2.22],
  [0.62, 2.30],
  [0.80, 2.40],
  [0.86, 2.55],
  [0.82, 2.70],
  [0.70, 2.78],
  [0.00, 2.78],
];

const profilePoints = profile.map(([x, y]) => new THREE.Vector2(x, y));
const kingBodyGeo = new THREE.LatheGeometry(profilePoints, 128);
kingBodyGeo.computeVertexNormals();
const kingBody = new THREE.Mesh(kingBodyGeo, kingMat);
kingBody.castShadow = true;
kingBody.receiveShadow = true;
kingWrapper.add(kingBody);

/* ---------- Subtle silver trim rings ---------- */
function addTrimRing(y, radius, tube = 0.022) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 96),
    trimMat
  );
  ring.position.y = y;
  ring.rotation.x = Math.PI / 2;
  kingWrapper.add(ring);
  return ring;
}
addTrimRing(0.21, 1.09);   // base trim
addTrimRing(1.92, 0.62);   // collar trim
addTrimRing(2.29, 0.51);   // below crown

/* ---------- Pedestal beneath the king ---------- */
const pedestalGeo = new THREE.CylinderGeometry(1.45, 1.6, 0.22, 64);
const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
pedestal.position.y = -0.12;
pedestal.receiveShadow = true;
kingWrapper.add(pedestal);

/* ---------- Globe on top (replaces the cross) ---------- */
const globeGroup = new THREE.Group();

// Core globe sphere (subtle dark glass)
const globeR = 0.42;
const globeCore = new THREE.Mesh(
  new THREE.SphereGeometry(globeR, 48, 32),
  globeMat
);
globeGroup.add(globeCore);

// Meridian lines (longitudes) — thin torus rings tilted at various Y angles
const meridianCount = 8;
for (let i = 0; i < meridianCount; i++) {
  const mer = new THREE.Mesh(
    new THREE.TorusGeometry(globeR * 1.005, 0.006, 8, 96),
    meridianMat
  );
  mer.rotation.y = (i / meridianCount) * Math.PI;
  globeGroup.add(mer);
}

// Parallels (latitudes) — horizontal rings at varying heights
const parallels = [-0.7, -0.4, 0, 0.4, 0.7];
parallels.forEach((t) => {
  const r = globeR * Math.sqrt(1 - t * t);
  const par = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.005, 0.006, 8, 96),
    meridianMat
  );
  par.rotation.x = Math.PI / 2;
  par.position.y = globeR * t;
  globeGroup.add(par);
});

// Mounting post between king neck and globe
const post = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.1, 0.25, 16),
  trimMat
);
post.position.y = -0.55;
globeGroup.add(post);

globeGroup.position.y = 3.25;
kingWrapper.add(globeGroup);

/* ---------- Soft glow halo behind the king ---------- */
const kingHaloGeo = new THREE.SphereGeometry(2.6, 24, 16);
const kingHaloMat = new THREE.MeshBasicMaterial({
  color: 0xc44cf7,
  transparent: true,
  opacity: 0.06,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const kingHalo = new THREE.Mesh(kingHaloGeo, kingHaloMat);
kingHalo.position.y = 1.4;
kingWrapper.add(kingHalo);

/* ---------- Orbiting rings (subtle, atmospheric) ---------- */
const rings = [];
const ringConfigs = [
  { radius: 2.5, tube: 0.012, color: 0xff6b9d, tilt: [Math.PI / 2.4, 0, 0.1], speed: 0.12 },
  { radius: 2.9, tube: 0.010, color: 0x4facfe, tilt: [Math.PI / 2, 0.3, 0.5], speed: -0.08 },
  { radius: 3.3, tube: 0.008, color: 0xc44cf7, tilt: [Math.PI / 2.2, 0.6, 1.1], speed: 0.06 },
];
ringConfigs.forEach((cfg) => {
  const rg = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 160);
  const rm = new THREE.MeshBasicMaterial({
    color: cfg.color, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(rg, rm);
  ring.rotation.set(...cfg.tilt);
  ring.position.y = 1.4;
  ring.userData = { baseRot: [...cfg.tilt], speed: cfg.speed };
  kingWrapper.add(ring);
  rings.push(ring);
});

logoGroup.rotation.x = 0;

// Legacy compatibility (unused)
const orbA = null;
const orbB = null;

const kingRefs = { globeGroup, kingHaloMat, kingBody, rings };

/* ===== Floating Satellites ===== */
const satellites = [];
const satGeos = [
  new THREE.OctahedronGeometry(0.3, 0),
  new THREE.TetrahedronGeometry(0.35, 0),
  new THREE.IcosahedronGeometry(0.25, 0),
  new THREE.DodecahedronGeometry(0.28, 0),
];
for (let i = 0; i < 8; i++) {
  const geo = satGeos[i % satGeos.length];
  const mat = new THREE.MeshStandardMaterial({
    color: palette[i % palette.length].getHex(),
    metalness: 0.8,
    roughness: 0.2,
    emissive: palette[i % palette.length].getHex(),
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const angle = (i / 8) * Math.PI * 2;
  const radius = 5 + Math.random() * 2;
  mesh.position.set(
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 4,
    Math.sin(angle) * radius
  );
  mesh.userData = {
    baseAngle: angle,
    radius,
    baseY: mesh.position.y,
    speed: 0.3 + Math.random() * 0.4,
    rotSpeed: new THREE.Vector3(Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.02),
  };
  scene.add(mesh);
  satellites.push(mesh);
}

/* =========================================================
   SCROLL-DRIVEN SCENE CHOREOGRAPHY
   ========================================================= */
const sceneStates = [
  // 0: Hero — centered logo, pulled back
  { camPos: [0, 0, 12], camLook: [0, 0, 0], coreRot: [0, 0, 0], coreScale: 1,    logoPos: [0, 0, 0] },
  // 1: Manifesto — logo drifts up-right
  { camPos: [3, 1, 14], camLook: [0, 0, 0], coreRot: [0.3, 1.2, 0], coreScale: 1.05, logoPos: [2, 1, -1] },
  // 2: Services — logo off to the right side
  { camPos: [-7, 0, 10], camLook: [0, 0, 0], coreRot: [0, 2.2, 0.2], coreScale: 0.9, logoPos: [3, -0.5, -2] },
  // 3: Work — logo behind, overhead angle
  { camPos: [0, 6, 11], camLook: [0, 0, 0], coreRot: [0.8, 3.2, 0], coreScale: 1.1, logoPos: [0, -1, -3] },
  // 4: Process — logo drifts lower-left
  { camPos: [5, -2, 11], camLook: [0, 0, 0], coreRot: [-0.3, 4.5, 0.4], coreScale: 1, logoPos: [-3, -1, 0] },
  // 5: Contact — logo centered and larger
  { camPos: [0, 0, 7], camLook: [0, 0, 0], coreRot: [0, 5.8, 0], coreScale: 1.3, logoPos: [0, 0, 1] },
];

let scrollProgress = 0; // 0..1 across page
let currentState = { ...sceneStates[0] };
const targetState = {
  camPos: new THREE.Vector3(...sceneStates[0].camPos),
  camLook: new THREE.Vector3(...sceneStates[0].camLook),
  coreRot: new THREE.Euler(...sceneStates[0].coreRot),
  coreScale: sceneStates[0].coreScale,
  logoPos: new THREE.Vector3(...sceneStates[0].logoPos),
};

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpArr(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }

function updateFromScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  scrollProgress = Math.max(0, Math.min(1, window.scrollY / max));
  document.getElementById('scrollProgress').style.width = (scrollProgress * 100) + '%';

  // Interpolate between scenes
  const segment = scrollProgress * (sceneStates.length - 1);
  const idx = Math.floor(segment);
  const t = segment - idx;
  const a = sceneStates[idx];
  const b = sceneStates[Math.min(idx + 1, sceneStates.length - 1)];

  const ease = t * t * (3 - 2 * t); // smoothstep

  targetState.camPos.fromArray(lerpArr(a.camPos, b.camPos, ease));
  targetState.camLook.fromArray(lerpArr(a.camLook, b.camLook, ease));
  targetState.coreRot.set(
    lerp(a.coreRot[0], b.coreRot[0], ease),
    lerp(a.coreRot[1], b.coreRot[1], ease),
    lerp(a.coreRot[2], b.coreRot[2], ease),
  );
  targetState.coreScale = lerp(a.coreScale, b.coreScale, ease);
  targetState.logoPos.fromArray(lerpArr(a.logoPos, b.logoPos, ease));
}

window.addEventListener('scroll', updateFromScroll, { passive: true });
updateFromScroll();

/* =========================================================
   MOUSE PARALLAX
   ========================================================= */
const mouse = new THREE.Vector2(0, 0);
const mouseTarget = new THREE.Vector2(0, 0);
window.addEventListener('mousemove', (e) => {
  mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseTarget.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

/* =========================================================
   RENDER LOOP
   ========================================================= */
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.05);

  // Smooth mouse
  mouse.x += (mouseTarget.x - mouse.x) * 0.08;
  mouse.y += (mouseTarget.y - mouse.y) * 0.08;

  // Camera: target + mouse parallax
  camera.position.x += (targetState.camPos.x + mouse.x * 0.6 - camera.position.x) * 0.06;
  camera.position.y += (targetState.camPos.y + mouse.y * 0.4 - camera.position.y) * 0.06;
  camera.position.z += (targetState.camPos.z - camera.position.z) * 0.06;
  camera.lookAt(targetState.camLook);

  // Core: lerp rotation + scale, plus ambient spin
  coreGroup.rotation.x += (targetState.coreRot.x - coreGroup.rotation.x) * 0.04;
  coreGroup.rotation.y += (targetState.coreRot.y - coreGroup.rotation.y) * 0.04 + 0.002;
  coreGroup.rotation.z += (targetState.coreRot.z - coreGroup.rotation.z) * 0.04;
  const s = targetState.coreScale;
  coreGroup.scale.x += (s - coreGroup.scale.x) * 0.06;
  coreGroup.scale.y = coreGroup.scale.z = coreGroup.scale.x;

  // ===== CHESS KING: idle animation =====
  logoParts.forEach((part) => {
    const elapsed = t - part.introStart;
    const p = Math.max(0, Math.min(1, elapsed / part.introDuration));
    const drawT = 1 - Math.pow(1 - p, 3);
    part.mainGeo.setDrawRange(0, Math.floor(part.totalMain * drawT));
    part.glowGeo.setDrawRange(0, Math.floor(part.totalGlow * drawT));
    part.glowMat.opacity = drawT * (0.22 + Math.sin(t * 2) * 0.1);
  });

  // King body: subtle clearcoat breathing (no emissive glow — keep realistic)
  kingMat.clearcoatRoughness = 0.04 + Math.sin(t * 0.6) * 0.02;

  // Globe: slow Earth-like rotation
  kingRefs.globeGroup.rotation.y = t * 0.35;

  // Halo pulse
  kingRefs.kingHaloMat.opacity = 0.05 + Math.sin(t * 1.2) * 0.03;

  // Orbiting rings
  kingRefs.rings.forEach((ring) => {
    const [rx, ry, rz] = ring.userData.baseRot;
    ring.rotation.set(rx, ry + t * ring.userData.speed, rz + t * ring.userData.speed * 0.3);
  });

  // Whole king: slow majestic rotation + gentle breathing
  logoGroup.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  logoGroup.rotation.y = t * 0.25;  // continuous slow spin
  logoGroup.rotation.x = Math.sin(t * 0.4) * 0.04;

  // Scroll-driven position (independent of camera)
  logoGroup.position.x += (targetState.logoPos.x - logoGroup.position.x) * 0.05;
  logoGroup.position.y += (targetState.logoPos.y - logoGroup.position.y) * 0.05;
  logoGroup.position.z += (targetState.logoPos.z - logoGroup.position.z) * 0.05;

  // Satellites orbit
  satellites.forEach((sat) => {
    const d = sat.userData;
    const ang = d.baseAngle + t * d.speed * 0.3;
    sat.position.x = Math.cos(ang) * d.radius;
    sat.position.z = Math.sin(ang) * d.radius;
    sat.position.y = d.baseY + Math.sin(t * d.speed + d.baseAngle) * 0.5;
    sat.rotation.x += d.rotSpeed.x;
    sat.rotation.y += d.rotSpeed.y;
    sat.rotation.z += d.rotSpeed.z;
  });

  // Stars drift
  stars.rotation.y = t * 0.01;
  stars.rotation.x = t * 0.005;

  // Dust: drift particles and wrap around a box volume
  {
    const arr = dust.geometry.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      arr[i*3]   += dustVel[i*3];
      arr[i*3+1] += dustVel[i*3+1];
      arr[i*3+2] += dustVel[i*3+2];
      if (arr[i*3]   >  10) arr[i*3]   = -10;
      if (arr[i*3]   < -10) arr[i*3]   =  10;
      if (arr[i*3+1] >   6) arr[i*3+1] =  -6;
      if (arr[i*3+1] <  -6) arr[i*3+1] =   6;
    }
    dust.geometry.attributes.position.needsUpdate = true;
  }

  // Shooting stars: spawn periodically, move along direction, fade
  if (t > nextShootAt) {
    spawnShootingStar();
    nextShootAt = t + 2.5 + Math.random() * 3;
  }
  shootingStars.forEach((s) => {
    if (!s.userData.alive) return;
    s.userData.t += dt;
    const life = s.userData.t;
    s.position.addScaledVector(s.userData.dir, s.userData.speed * dt);
    // Fade in fast, then out
    const fadeIn  = Math.min(1, life / 0.15);
    const fadeOut = Math.max(0, 1 - Math.max(0, life - 0.6) / 0.8);
    s.material.opacity = 0.9 * fadeIn * fadeOut;
    if (life > 1.4) { s.userData.alive = false; s.material.opacity = 0; }
  });

  // Lights orbit slowly
  keyLight.position.x = Math.cos(t * 0.3) * 10;
  keyLight.position.z = Math.sin(t * 0.3) * 10;
  fillLight.position.x = Math.cos(t * 0.2 + Math.PI) * 10;
  fillLight.position.z = Math.sin(t * 0.2 + Math.PI) * 10;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* =========================================================
   RESIZE
   ========================================================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =========================================================
   LOADER
   ========================================================= */
// Hide via window.load (normal path) and a hard timeout fallback so the
// loader never gets stuck if the 3D scene hits an error.
function hideLoader() {
  const el = document.getElementById('loader');
  if (el) el.classList.add('hidden');
}
window.addEventListener('load', () => setTimeout(hideLoader, 600));
setTimeout(hideLoader, 3000);
window.addEventListener('error', hideLoader);

/* =========================================================
   CUSTOM CURSOR
   ========================================================= */
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
let cx = 0, cy = 0, fx = 0, fy = 0, tx = 0, ty = 0;

window.addEventListener('mousemove', (e) => {
  tx = e.clientX; ty = e.clientY;
});

function updateCursor() {
  cx += (tx - cx) * 0.5;
  cy += (ty - cy) * 0.5;
  fx += (tx - fx) * 0.15;
  fy += (ty - fy) * 0.15;
  cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  cursorFollower.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
  requestAnimationFrame(updateCursor);
}
updateCursor();

document.querySelectorAll('[data-hover]').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hover');
    cursorFollower.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hover');
    cursorFollower.classList.remove('hover');
  });
});

/* =========================================================
   SCROLL REVEAL — IntersectionObserver for [data-reveal]
   ========================================================= */
(function setupReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));

  // Assign --i to stagger children
  document.querySelectorAll('[data-reveal-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });
})();

/* =========================================================
   SPLIT TEXT — wrap each word in a mask for line-up reveals
   ========================================================= */
(function splitText() {
  document.querySelectorAll('[data-split="words"]').forEach((el) => {
    const walk = (node) => {
      const children = [...node.childNodes];
      children.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else if (part.length) {
              const w = document.createElement('span');
              w.className = 'word';
              const inner = document.createElement('span');
              inner.className = 'inner';
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    // Re-index .word elements for staggered delay
    el.querySelectorAll('.word > .inner').forEach((inner, i) => {
      inner.style.setProperty('--i', i);
    });
  });
})();

/* Scene in-view marker (kept for legacy CSS like .strike) */
const sceneIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
}, { threshold: 0.4 });
document.querySelectorAll('.scene').forEach(s => sceneIo.observe(s));

/* =========================================================
   STAT COUNTER — animate numbers when stats-strip enters
   ========================================================= */
(function statCounters() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  const animateNum = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toString();
    };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNum(entry.target);
        cio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach((n) => cio.observe(n));
})();

/* =========================================================
   MAGNETIC BUTTONS — slight pull toward the cursor
   ========================================================= */
(function magnetic() {
  const strength = 0.35;
  document.querySelectorAll('.btn, .btn-ghost').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.setProperty('--tx', `${mx * strength}px`);
      el.style.setProperty('--ty', `${my * strength}px`);
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
    });
  });
})();

/* =========================================================
   3D TILT + spotlight on service cards
   ========================================================= */
(function cardTilt() {
  const cards = document.querySelectorAll('.service-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -10;  // degrees
      const ry = (px - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* =========================================================
   SMOOTH SCROLL — lerped wheel/scroll for buttery feel
   ========================================================= */
(function smoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let target = window.scrollY;
  let current = window.scrollY;
  const lerpFactor = 0.12;

  window.addEventListener('scroll', () => {
    target = window.scrollY;
  }, { passive: true });

  function loop() {
    current += (target - current) * lerpFactor;
    if (Math.abs(target - current) < 0.5) current = target;
    // Apply subtle scroll-skew via CSS var for dramatic effect
    const delta = target - current;
    document.documentElement.style.setProperty('--scroll-skew', `${Math.max(-6, Math.min(6, delta * 0.05))}deg`);
    requestAnimationFrame(loop);
  }
  loop();
})();

/* =========================================================
   HERO TITLE LINE SPLIT (kept, works with existing CSS anim)
   ========================================================= */
document.querySelectorAll('.hero-title .line').forEach((line) => {
  const html = line.innerHTML;
  line.innerHTML = `<span>${html}</span>`;
});

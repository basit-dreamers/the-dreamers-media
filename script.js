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

/* ===== Lights ===== */
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const keyLight = new THREE.PointLight(0xff6b9d, 3, 50);
keyLight.position.set(8, 6, 6);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x4facfe, 2.5, 50);
fillLight.position.set(-8, -4, 6);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xc44cf7, 2, 40);
rimLight.position.set(0, 0, -10);
scene.add(rimLight);

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

/* ---------- Materials ---------- */
const kingMat = new THREE.MeshPhysicalMaterial({
  color: 0xf5f5fa,
  roughness: 0.18,
  metalness: 0.95,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  emissive: 0xc44cf7,
  emissiveIntensity: 0.22,
});

const crossMat = new THREE.MeshPhysicalMaterial({
  color: 0xfee140,
  roughness: 0.2,
  metalness: 1,
  emissive: 0xfee140,
  emissiveIntensity: 0.5,
  clearcoat: 1,
});

const baseAccentMat = new THREE.MeshPhysicalMaterial({
  color: 0xff6b9d,
  roughness: 0.3,
  metalness: 0.8,
  emissive: 0xff6b9d,
  emissiveIntensity: 0.3,
});

/* ---------- King body — lathe from a 2D profile ---------- */
/*
  Profile (X = radius, Y = height). Traditional Staunton silhouette:
  wide base, stepped foot ring, tapering column, collar, bishop-like
  onion bulge, narrow neck, flared crown with battlements, topped by a cross.
*/
// Inner wrapper so we can offset the king's pivot without fighting
// the scroll-driven logoGroup.position lerp.
const kingWrapper = new THREE.Group();
kingWrapper.position.y = -1.4;
logoGroup.add(kingWrapper);
const profile = [
  [0.00, 0.00],
  [1.10, 0.00],
  [1.10, 0.08],
  [1.00, 0.18],
  [1.05, 0.22],
  [1.05, 0.32],
  [0.85, 0.40],
  [0.75, 0.55],
  [0.55, 0.75],
  [0.45, 1.10],
  [0.42, 1.55],
  [0.55, 1.75],
  [0.65, 1.85],
  [0.50, 1.95],
  [0.40, 2.05],   // neck
  [0.42, 2.15],
  [0.55, 2.25],   // base of crown
  [0.80, 2.35],   // crown flare out
  [0.88, 2.50],
  [0.85, 2.65],
  [0.75, 2.75],   // top rim of crown (battlement base)
  [0.00, 2.75],
];

const profilePoints = profile.map(([x, y]) => new THREE.Vector2(x, y));
const kingBodyGeo = new THREE.LatheGeometry(profilePoints, 96);
const kingBody = new THREE.Mesh(kingBodyGeo, kingMat);
kingWrapper.add(kingBody);

/* ---------- Crown battlements — 8 little blocks around the top ---------- */
const battlements = new THREE.Group();
const battCount = 8;
for (let i = 0; i < battCount; i++) {
  const ang = (i / battCount) * Math.PI * 2;
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.18, 0.22),
    kingMat
  );
  const r = 0.72;
  b.position.set(Math.cos(ang) * r, 2.82, Math.sin(ang) * r);
  b.rotation.y = -ang;
  battlements.add(b);
}
kingWrapper.add(battlements);

// Decorative pink ring at the base of the crown
const crownRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.58, 0.045, 10, 64),
  baseAccentMat
);
crownRing.position.y = 2.28;
crownRing.rotation.x = Math.PI / 2;
kingWrapper.add(crownRing);

// Decorative ring on the collar
const collarRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.58, 0.04, 10, 64),
  baseAccentMat
);
collarRing.position.y = 1.78;
collarRing.rotation.x = Math.PI / 2;
kingWrapper.add(collarRing);

// Decorative ring on the base
const baseRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.06, 0.04, 10, 64),
  baseAccentMat
);
baseRing.position.y = 0.22;
baseRing.rotation.x = Math.PI / 2;
kingWrapper.add(baseRing);

/* ---------- Golden cross on top ---------- */
const crossGroup = new THREE.Group();
const crossVertical = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.75, 0.14),
  crossMat
);
crossVertical.position.y = 0.38;
crossGroup.add(crossVertical);

const crossHorizontal = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.14, 0.14),
  crossMat
);
crossHorizontal.position.y = 0.5;
crossGroup.add(crossHorizontal);

// Tiny orb at intersection for flair
const crossOrb = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 12),
  crossMat
);
crossOrb.position.y = 0.5;
crossGroup.add(crossOrb);

crossGroup.position.y = 2.95;
kingWrapper.add(crossGroup);

/* ---------- Soft glow halo behind the king ---------- */
const kingHaloGeo = new THREE.SphereGeometry(2.6, 24, 16);
const kingHaloMat = new THREE.MeshBasicMaterial({
  color: 0xc44cf7,
  transparent: true,
  opacity: 0.08,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const kingHalo = new THREE.Mesh(kingHaloGeo, kingHaloMat);
kingHalo.position.y = 1.4;
kingWrapper.add(kingHalo);

/* ---------- Orbiting rings (royal court vibe) ---------- */
const rings = [];
const ringConfigs = [
  { radius: 2.4, tube: 0.02, color: 0xff6b9d, tilt: [Math.PI / 2.4, 0, 0.1], speed: 0.15 },
  { radius: 2.8, tube: 0.015, color: 0x4facfe, tilt: [Math.PI / 2, 0.3, 0.5], speed: -0.11 },
  { radius: 3.2, tube: 0.012, color: 0xfee140, tilt: [Math.PI / 2.2, 0.6, 1.1], speed: 0.08 },
];
ringConfigs.forEach((cfg) => {
  const rg = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 160);
  const rm = new THREE.MeshBasicMaterial({
    color: cfg.color, transparent: true, opacity: 0.6,
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

const kingRefs = { crossGroup, crossOrb, kingHaloMat, kingBody, rings };

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

  // King body shimmer
  kingMat.emissiveIntensity = 0.18 + Math.sin(t * 1.2) * 0.12;

  // Cross glows and slowly spins independently
  kingRefs.crossGroup.rotation.y = t * 0.4;
  crossMat.emissiveIntensity = 0.45 + Math.sin(t * 1.8) * 0.25;
  kingRefs.crossOrb.scale.setScalar(1 + Math.sin(t * 2.5) * 0.15);

  // Halo pulse
  kingRefs.kingHaloMat.opacity = 0.06 + Math.sin(t * 1.2) * 0.04;

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
   SCROLL REVEAL
   ========================================================= */
const revealables = document.querySelectorAll(
  '.service-card, .work-row, .process-step, .section-head, .lead, .big-text, .contact-form, .contact-alt'
);
revealables.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealables.forEach(el => io.observe(el));

/* Mark scenes in-view for triggered animations */
const sceneIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.4 });
document.querySelectorAll('.scene').forEach(s => sceneIo.observe(s));

/* =========================================================
   SPLIT HERO TITLE INTO ANIMATED LINES
   ========================================================= */
document.querySelectorAll('.hero-title .line').forEach((line) => {
  const html = line.innerHTML;
  line.innerHTML = `<span>${html}</span>`;
});

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

/* ===== Central Object: Iridescent Torus Knot Hero ===== */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const logoGroup = new THREE.Group();
coreGroup.add(logoGroup);

// Shared iridescent metallic material for the main knot
const logoMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.18,
  metalness: 1.0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  iridescence: 1,
  iridescenceIOR: 1.8,
  iridescenceThicknessRange: [100, 800],
  emissive: 0xc44cf7,
  emissiveIntensity: 0.25,
  transparent: true,
  opacity: 1,
});

const haloMatBase = new THREE.MeshBasicMaterial({
  color: 0xc44cf7,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const logoParts = [];

/* ---------- Main torus knot ---------- */
const KNOT_R = 1.6;
const KNOT_TUBE = 0.42;
const KNOT_P = 2;
const KNOT_Q = 3;

const knotGeo = new THREE.TorusKnotGeometry(KNOT_R, KNOT_TUBE, 256, 32, KNOT_P, KNOT_Q);
knotGeo.setDrawRange(0, 0);
const knotMesh = new THREE.Mesh(knotGeo, logoMat);
logoGroup.add(knotMesh);

// Wireframe overlay — same geometry, slightly inflated look via thin line
const wireGeo = new THREE.TorusKnotGeometry(KNOT_R, KNOT_TUBE * 1.06, 256, 12, KNOT_P, KNOT_Q);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0xff6b9d,
  wireframe: true,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
wireGeo.setDrawRange(0, 0);
const wireMesh = new THREE.Mesh(wireGeo, wireMat);
logoGroup.add(wireMesh);

logoParts.push({
  mainGeo: knotGeo,
  glowGeo: wireGeo,
  glowMat: wireMat,
  totalMain: knotGeo.index.count,
  totalGlow: wireGeo.index.count,
  introStart: 0.2,
  introDuration: 1.8,
});

/* ---------- Inner glowing core orb ---------- */
const coreOrbGeo = new THREE.IcosahedronGeometry(0.55, 2);
const coreOrbMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
});
const coreOrb = new THREE.Mesh(coreOrbGeo, coreOrbMat);
logoGroup.add(coreOrb);

// Outer soft halo around the orb
const haloGeo = new THREE.IcosahedronGeometry(0.95, 2);
const haloMat = new THREE.MeshBasicMaterial({
  color: 0xff6b9d,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const haloMesh = new THREE.Mesh(haloGeo, haloMat);
logoGroup.add(haloMesh);

/* ---------- Orbiting rings around the knot ---------- */
const rings = [];
const ringConfigs = [
  { radius: 2.6, tube: 0.015, color: 0xff6b9d, tilt: [Math.PI / 2, 0, 0] },
  { radius: 2.9, tube: 0.012, color: 0x4facfe, tilt: [Math.PI / 2, 0, Math.PI / 4] },
  { radius: 3.2, tube: 0.010, color: 0xc44cf7, tilt: [Math.PI / 2, Math.PI / 5, Math.PI / 2.2] },
];
ringConfigs.forEach((cfg, i) => {
  const rg = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 160);
  const rm = new THREE.MeshBasicMaterial({
    color: cfg.color,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(rg, rm);
  ring.rotation.set(...cfg.tilt);
  ring.userData = { baseRot: [...cfg.tilt], speed: 0.12 + i * 0.08 };
  logoGroup.add(ring);
  rings.push(ring);
});

logoGroup.rotation.x = -0.12;

// Legacy compatibility (unused)
const orbA = null;
const orbB = null;

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

  // ===== LOGO: draw-in intro (knot + wireframe overlay) =====
  logoParts.forEach((part) => {
    const elapsed = t - part.introStart;
    const p = Math.max(0, Math.min(1, elapsed / part.introDuration));
    const drawT = 1 - Math.pow(1 - p, 3); // easeOutCubic

    part.mainGeo.setDrawRange(0, Math.floor(part.totalMain * drawT));
    part.glowGeo.setDrawRange(0, Math.floor(part.totalGlow * drawT));
    part.glowMat.opacity = drawT * (0.22 + Math.sin(t * 2) * 0.1);
  });

  // Shared material shimmer — iridescence breathing
  logoMat.emissiveIntensity = 0.22 + Math.sin(t * 1.4) * 0.14;

  // Knot continuous spin
  knotMesh.rotation.y = t * 0.35;
  knotMesh.rotation.x = Math.sin(t * 0.25) * 0.3;
  wireMesh.rotation.copy(knotMesh.rotation);

  // Core orb pulse
  const orbPulse = 1 + Math.sin(t * 2.2) * 0.08;
  coreOrb.scale.setScalar(orbPulse);
  coreOrbMat.opacity = 0.75 + Math.sin(t * 2.2) * 0.2;
  haloMesh.scale.setScalar(1 + Math.sin(t * 1.5) * 0.1);
  haloMat.opacity = 0.18 + Math.sin(t * 1.5) * 0.08;

  // Rings orbit
  rings.forEach((ring, i) => {
    const [rx, ry, rz] = ring.userData.baseRot;
    ring.rotation.set(rx, ry + t * ring.userData.speed, rz);
  });

  // Whole logo: gentle breathing + subtle 3D rocking
  logoGroup.scale.setScalar(1 + Math.sin(t * 0.8) * 0.02);
  logoGroup.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.05;
  logoGroup.rotation.y = Math.sin(t * 0.4) * 0.08;

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

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

/* ===== Central Object: The Dreamers Media Logo (4 quarter-arcs) ===== */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const logoGroup = new THREE.Group();
coreGroup.add(logoGroup);

/* ---------- Logo geometry: square frame + single quarter-arc ---------- */
const SIZE = 3.2;              // side length of the square (half-extent = SIZE/2)
const FRAME_TUBE = 0.09;       // thickness of the square frame edges
const ARC_TUBE = 0.14;         // thickness of the quarter arc (slightly thicker to pop)
const ARC_RADIUS = SIZE;       // arc spans full side so it touches both edges
const TUBULAR = 160;
const RADIAL = 22;

const HALF = SIZE / 2;

// Shared white metallic material for the whole logo
const logoMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.12,
  metalness: 0.95,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  emissive: 0xc44cf7,
  emissiveIntensity: 0.3,
  transparent: true,
  opacity: 1,
});

const haloMat = new THREE.MeshBasicMaterial({
  color: 0xc44cf7,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Build the 4 edges of the square as thin cylinders.
// Each edge will be drawn progressively via setDrawRange on its geometry.
const edges = [
  // [startVec, endVec]
  { from: new THREE.Vector3(-HALF, -HALF, 0), to: new THREE.Vector3( HALF, -HALF, 0) }, // bottom
  { from: new THREE.Vector3( HALF, -HALF, 0), to: new THREE.Vector3( HALF,  HALF, 0) }, // right
  { from: new THREE.Vector3( HALF,  HALF, 0), to: new THREE.Vector3(-HALF,  HALF, 0) }, // top
  { from: new THREE.Vector3(-HALF,  HALF, 0), to: new THREE.Vector3(-HALF, -HALF, 0) }, // left
];

const logoParts = []; // { mainGeo, glowGeo, glowMat, totalMain, totalGlow, introStart, introDuration }

function makeEdge(from, to, tube, material) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const geo = new THREE.CylinderGeometry(tube, tube, length, 8, 32, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(mid);
  // Align cylinder (default up Y) with dir
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return { mesh, geo, totalIndex: null, totalVertex: geo.attributes.position.count };
}

// Build frame edges (main + halo) — use non-indexed buffer slicing by drawRange over vertex count
edges.forEach((e, i) => {
  const main = makeEdge(e.from, e.to, FRAME_TUBE, logoMat);
  const glow = makeEdge(e.from, e.to, FRAME_TUBE * 2.8, haloMat.clone());
  // For CylinderGeometry (non-indexed), drawRange is over groups of 3 vertices.
  // Hide until intro reveals them.
  main.geo.setDrawRange(0, 0);
  glow.geo.setDrawRange(0, 0);
  logoGroup.add(main.mesh);
  logoGroup.add(glow.mesh);
  logoParts.push({
    mainGeo: main.geo,
    glowGeo: glow.geo,
    glowMat: glow.mesh.material,
    totalMain: main.geo.index ? main.geo.index.count : main.geo.attributes.position.count,
    totalGlow: glow.geo.index ? glow.geo.index.count : glow.geo.attributes.position.count,
    introStart: 0.2 + i * 0.15,
    introDuration: 0.9,
    kind: 'edge',
  });
});

// Quarter arc: center of the circle sits at the top-left corner of the square,
// arc sweeps from bottom-left corner -> top-right corner (matches the reference image).
// Torus default sweeps 0..PI/2 starting at +X, going CCW.
// We want an arc whose center is at (-HALF, +HALF, 0) with radius = SIZE,
// and it should start at the top-right corner ( HALF,  HALF) = center + (+SIZE, 0)
// and end at the bottom-left corner (-HALF, -HALF) = center + (0, -SIZE).
// The default arc points are (R,0), rotating toward (0,R). We need it to go from
// (R,0) to (0,-R), so flip the sweep by scaling Y negative (rotate 180 about X) OR
// rotate the torus 270deg (−PI/2) about Z. Simpler: rotate the mesh so its arc
// covers the correct quadrant.
const arcMainGeo = new THREE.TorusGeometry(ARC_RADIUS, ARC_TUBE, RADIAL, TUBULAR, Math.PI / 2);
const arcMainMesh = new THREE.Mesh(arcMainGeo, logoMat);
// Place torus center at top-left corner of the square
arcMainMesh.position.set(-HALF, HALF, 0);
// Default sweep is +X to +Y; we need +X to -Y, so mirror by rotating about X by PI
arcMainMesh.rotation.x = Math.PI;
arcMainGeo.setDrawRange(0, 0);
logoGroup.add(arcMainMesh);

const arcGlowGeo = new THREE.TorusGeometry(ARC_RADIUS, ARC_TUBE * 2.8, 14, TUBULAR, Math.PI / 2);
const arcGlowMat = haloMat.clone();
arcGlowMat.color = new THREE.Color(0xff6b9d);
const arcGlowMesh = new THREE.Mesh(arcGlowGeo, arcGlowMat);
arcGlowMesh.position.set(-HALF, HALF, 0);
arcGlowMesh.rotation.x = Math.PI;
arcGlowGeo.setDrawRange(0, 0);
logoGroup.add(arcGlowMesh);

// TorusGeometry is indexed
const ARC_MAIN_TOTAL = arcMainGeo.index.count;
const ARC_GLOW_TOTAL = arcGlowGeo.index.count;

logoParts.push({
  mainGeo: arcMainGeo,
  glowGeo: arcGlowGeo,
  glowMat: arcGlowMat,
  totalMain: ARC_MAIN_TOTAL,
  totalGlow: ARC_GLOW_TOTAL,
  introStart: 0.85,       // draw arc last, after frame is done
  introDuration: 1.2,
  kind: 'arc',
});

// Glowing endpoint orbs at the arc's start and end
function makeOrb(x, y) {
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0,
    })
  );
  orb.position.set(x, y, 0);
  logoGroup.add(orb);
  return orb;
}
// Arc endpoints: top-right corner and bottom-left corner
const orbA = makeOrb( HALF,  HALF);
const orbB = makeOrb(-HALF, -HALF);

logoGroup.rotation.x = -0.12;

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

  // ===== LOGO: draw-in intro + idle motion =====
  logoParts.forEach((part) => {
    const elapsed = t - part.introStart;
    const p = Math.max(0, Math.min(1, elapsed / part.introDuration));
    const drawT = 1 - Math.pow(1 - p, 3); // easeOutCubic

    part.mainGeo.setDrawRange(0, Math.floor(part.totalMain * drawT));
    part.glowGeo.setDrawRange(0, Math.floor(part.totalGlow * drawT));
    part.glowMat.opacity = drawT * (0.25 + Math.sin(t * 2) * 0.12);
  });

  // Material shimmer
  logoMat.emissiveIntensity = 0.28 + Math.sin(t * 1.4) * 0.18;

  // Endpoint orbs fade in with arc
  const orbFade = Math.max(0, Math.min(1, (t - 1.6) / 0.7));
  orbA.material.opacity = orbFade;
  orbB.material.opacity = orbFade;
  const pulse = 1 + Math.sin(t * 2.2) * 0.2;
  orbA.scale.setScalar(orbFade * pulse);
  orbB.scale.setScalar(orbFade * pulse);

  // Whole logo breathes + subtle rocking
  logoGroup.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  logoGroup.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.06;

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
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 800);
});

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

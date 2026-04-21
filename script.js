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

const ARC_RADIUS = 2.6;        // radius of each quarter-circle (bigger = more hero)
const ARC_TUBE = 0.16;         // chunky line thickness so the logo READS
const ARC_TUBULAR_SEGMENTS = 160;

// Each arc gets its own color from the brand palette
const arcColors = [0xff6b9d, 0xc44cf7, 0x4facfe, 0xfee140];

/**
 * Four quarter arcs. Each arc's circle-center sits at an outer corner
 * of the 2x2 grid. The arcs hug the outer corners (convex out, concave toward center).
 *
 * Quadrants (center positions) + z-rotation so the TorusGeometry default
 * (sweeps 0 -> PI/2) lines up with the right quadrant.
 */
const R = ARC_RADIUS;
const quadrants = [
  { pos: [-R, -R, 0], rot: 0,              color: arcColors[0] }, // BL
  { pos: [ R, -R, 0], rot: Math.PI / 2,    color: arcColors[1] }, // BR
  { pos: [ R,  R, 0], rot: Math.PI,        color: arcColors[2] }, // TR
  { pos: [-R,  R, 0], rot: Math.PI * 1.5,  color: arcColors[3] }, // TL
];

const logoArcs = [];
quadrants.forEach((q, i) => {
  // Each arc is its own subgroup so it can float/rotate independently
  // around its "anchor point" (the quadrant corner), while the assembly
  // lives as a whole in logoGroup.
  const arcGroup = new THREE.Group();
  arcGroup.position.set(...q.pos);

  // Main metallic tinted arc
  const geo = new THREE.TorusGeometry(
    R, ARC_TUBE, 24, ARC_TUBULAR_SEGMENTS, Math.PI / 2
  );
  const mat = new THREE.MeshPhysicalMaterial({
    color: q.color,
    roughness: 0.18,
    metalness: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    emissive: q.color,
    emissiveIntensity: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = q.rot;
  arcGroup.add(mesh);

  // Outer glow halo (additive)
  const glowGeo = new THREE.TorusGeometry(
    R, ARC_TUBE * 2.4, 14, ARC_TUBULAR_SEGMENTS, Math.PI / 2
  );
  const glowMat = new THREE.MeshBasicMaterial({
    color: q.color,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.z = q.rot;
  arcGroup.add(glow);

  // Store per-arc animation state
  arcGroup.userData = {
    anchor: new THREE.Vector3(...q.pos),
    index: i,
    phase: i * (Math.PI / 2),   // 90-degree phase offset so each arc breathes in turn
    driftSeed: Math.random() * 100,
    // Intro state: start exploded far out, ease back to anchor
    introStartTime: 0.6 + i * 0.12,
    introDuration: 1.4,
    offset: new THREE.Vector3(
      q.pos[0] * 3,
      q.pos[1] * 3,
      (Math.random() - 0.5) * 6,
    ),
    rotOffset: new THREE.Vector3(
      (Math.random() - 0.5) * Math.PI * 2,
      (Math.random() - 0.5) * Math.PI * 2,
      (Math.random() - 0.5) * Math.PI * 2,
    ),
  };

  // Start exploded out + spun
  arcGroup.position.copy(arcGroup.userData.anchor.clone().add(arcGroup.userData.offset));
  arcGroup.rotation.set(
    arcGroup.userData.rotOffset.x,
    arcGroup.userData.rotOffset.y,
    arcGroup.userData.rotOffset.z,
  );
  mat.opacity = 0;
  mat.transparent = true;
  glowMat.opacity = 0;

  logoGroup.add(arcGroup);
  logoArcs.push({ group: arcGroup, mat, glowMat });
});

// Center marker (small glowing orb where the four quadrants meet)
const centerDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 32, 32),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.5,
  })
);
logoGroup.add(centerDot);

// Soft center glow (sprite-like plane)
const centerGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.6, 24, 24),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
logoGroup.add(centerGlow);

// Slight forward tilt so the 3D depth reads better
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
  // 0: Hero — centered logo, slightly pulled back for the bigger mark
  { camPos: [0, 0, 12], camLook: [0, 0, 0], coreRot: [0, 0, 0], coreScale: 1 },
  // 1: Manifesto — pull back, tilt
  { camPos: [3, 1, 14], camLook: [0, 0, 0], coreRot: [0.3, 1.2, 0], coreScale: 1.05 },
  // 2: Services — side view
  { camPos: [-7, 0, 10], camLook: [0, 0, 0], coreRot: [0, 2.2, 0.2], coreScale: 0.9 },
  // 3: Work — overhead
  { camPos: [0, 6, 11], camLook: [0, 0, 0], coreRot: [0.8, 3.2, 0], coreScale: 1.1 },
  // 4: Process — diagonal
  { camPos: [5, -2, 11], camLook: [0, 0, 0], coreRot: [-0.3, 4.5, 0.4], coreScale: 1 },
  // 5: Contact — zoom in on the logo
  { camPos: [0, 0, 7], camLook: [0, 0, 0], coreRot: [0, 5.8, 0], coreScale: 1.3 },
];

let scrollProgress = 0; // 0..1 across page
let currentState = { ...sceneStates[0] };
const targetState = {
  camPos: new THREE.Vector3(...sceneStates[0].camPos),
  camLook: new THREE.Vector3(...sceneStates[0].camLook),
  coreRot: new THREE.Euler(...sceneStates[0].coreRot),
  coreScale: sceneStates[0].coreScale,
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

  // ===== LOGO: assemble intro + idle motion =====
  logoArcs.forEach((arc) => {
    const d = arc.group.userData;
    const elapsed = t - d.introStartTime;
    const p = Math.max(0, Math.min(1, elapsed / d.introDuration));
    // easeOutBack-ish for a little overshoot on assembly
    const eased = 1 - Math.pow(1 - p, 3);

    // Position: from anchor+offset -> anchor (+ subtle idle drift once settled)
    const driftT = t + d.driftSeed;
    const settle = Math.max(0, p);
    const idleX = Math.sin(driftT * 0.6 + d.phase) * 0.08 * settle;
    const idleY = Math.cos(driftT * 0.5 + d.phase) * 0.08 * settle;
    const idleZ = Math.sin(driftT * 0.7 + d.phase) * 0.15 * settle;

    arc.group.position.x = d.anchor.x + d.offset.x * (1 - eased) + idleX;
    arc.group.position.y = d.anchor.y + d.offset.y * (1 - eased) + idleY;
    arc.group.position.z = d.anchor.z + d.offset.z * (1 - eased) + idleZ;

    // Rotation: from random spin -> 0 (+ subtle idle rocking)
    const idleRX = Math.sin(driftT * 0.4) * 0.06 * settle;
    const idleRY = Math.cos(driftT * 0.35) * 0.06 * settle;
    arc.group.rotation.x = d.rotOffset.x * (1 - eased) + idleRX;
    arc.group.rotation.y = d.rotOffset.y * (1 - eased) + idleRY;
    arc.group.rotation.z = d.rotOffset.z * (1 - eased);

    // Fade in
    arc.mat.opacity = eased;
    arc.glowMat.opacity = eased * (0.25 + Math.sin(t * 2 + d.phase) * 0.1);

    // Emissive shimmer (per-arc phase offset)
    arc.mat.emissiveIntensity = 0.4 + Math.sin(t * 1.4 + d.phase) * 0.25;
  });

  // Center dot pulse (fades in after arcs assemble)
  const centerFade = Math.max(0, Math.min(1, (t - 1.6) / 0.8));
  centerDot.scale.setScalar(centerFade * (1 + Math.sin(t * 2) * 0.15));
  centerGlow.scale.setScalar(centerFade * (1 + Math.sin(t * 1.5) * 0.3));

  // Whole logo breathes very slightly
  logoGroup.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  // Subtle wobble on X for liveliness (preserved after intro tilt)
  logoGroup.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.06;

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

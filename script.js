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

/* ===== Central Object: Stylized Low-Poly 3D Pirate ===== */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const logoGroup = new THREE.Group();
coreGroup.add(logoGroup);

// Legacy — kept so any downstream references don't break
const logoMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.3, metalness: 0.6,
  emissive: 0xc44cf7, emissiveIntensity: 0.15,
  transparent: true, opacity: 1,
});
const haloMatBase = new THREE.MeshBasicMaterial({
  color: 0xc44cf7, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const logoParts = []; // no draw-in; pirate appears fully

/* ---------- Materials ---------- */
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2c48a, roughness: 0.6, metalness: 0.1 });
const coatMat = new THREE.MeshStandardMaterial({ color: 0x6b2a2a, roughness: 0.7, metalness: 0.15, emissive: 0x2a0808, emissiveIntensity: 0.3 });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5ecd6, roughness: 0.8, metalness: 0.05 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.8, metalness: 0.1 });
const beltMat = new THREE.MeshStandardMaterial({ color: 0xfee140, roughness: 0.35, metalness: 0.85, emissive: 0x6b4a00, emissiveIntensity: 0.3 });
const hatMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.9, metalness: 0.2 });
const beardMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0f, roughness: 0.95, metalness: 0 });
const patchMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.4 });
const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.4 });
const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe8eaf0, roughness: 0.15, metalness: 1, emissive: 0x4facfe, emissiveIntensity: 0.2 });
const hiltMat = new THREE.MeshStandardMaterial({ color: 0xfee140, roughness: 0.3, metalness: 1, emissive: 0x6b4a00, emissiveIntensity: 0.4 });
const bootMat = new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.85, metalness: 0.1 });

/* ---------- Pirate build ---------- */
const pirate = new THREE.Group();
logoGroup.add(pirate);

// Torso (coat)
const torso = new THREE.Mesh(
  new THREE.CylinderGeometry(0.75, 0.95, 1.7, 10),
  coatMat
);
torso.position.y = 0.3;
pirate.add(torso);

// Shirt chest triangle (V-neck look) — a small lighter box poking out
const shirt = new THREE.Mesh(
  new THREE.ConeGeometry(0.4, 0.7, 3),
  shirtMat
);
shirt.position.set(0, 0.75, 0.7);
shirt.rotation.x = Math.PI;
pirate.add(shirt);

// Belt
const belt = new THREE.Mesh(
  new THREE.TorusGeometry(0.95, 0.08, 8, 24),
  beltMat
);
belt.position.y = -0.4;
belt.rotation.x = Math.PI / 2;
pirate.add(belt);

// Belt buckle
const buckle = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.2, 0.12),
  beltMat
);
buckle.position.set(0, -0.4, 0.95);
pirate.add(buckle);

// Pants / legs
const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 1.0, 8), pantsMat);
legL.position.set(-0.35, -1.05, 0);
pirate.add(legL);
const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 1.0, 8), pantsMat);
legR.position.set(0.35, -1.05, 0);
pirate.add(legR);

// Boots
const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.6), bootMat);
bootL.position.set(-0.35, -1.68, 0.1);
pirate.add(bootL);
const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.6), bootMat);
bootR.position.set(0.35, -1.68, 0.1);
pirate.add(bootR);

// Head
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 20, 16),
  skinMat
);
head.position.y = 1.55;
pirate.add(head);

// Beard (cone under face)
const beard = new THREE.Mesh(
  new THREE.ConeGeometry(0.45, 0.65, 10),
  beardMat
);
beard.position.set(0, 1.15, 0.25);
beard.rotation.x = -0.15;
pirate.add(beard);

// Mustache — two small boxes
const mustL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), beardMat);
mustL.position.set(-0.12, 1.4, 0.52);
mustL.rotation.z = 0.35;
pirate.add(mustL);
const mustR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), beardMat);
mustR.position.set(0.12, 1.4, 0.52);
mustR.rotation.z = -0.35;
pirate.add(mustR);

// Eye (left, visible)
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat);
eye.position.set(-0.2, 1.62, 0.48);
pirate.add(eye);
const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), pupilMat);
pupil.position.set(-0.2, 1.62, 0.555);
pirate.add(pupil);

// Eye patch (right) + strap
const patch = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), patchMat);
patch.position.set(0.2, 1.62, 0.51);
pirate.add(patch);
const strap = new THREE.Mesh(
  new THREE.TorusGeometry(0.56, 0.02, 6, 32),
  patchMat
);
strap.position.set(0, 1.62, 0);
strap.rotation.y = -0.25;
pirate.add(strap);

// Tricorn hat — flat disc + top cone
const hatBrim = new THREE.Mesh(
  new THREE.CylinderGeometry(0.85, 0.85, 0.08, 3),
  hatMat
);
hatBrim.position.y = 2.05;
hatBrim.rotation.y = Math.PI / 2;
pirate.add(hatBrim);

const hatTop = new THREE.Mesh(
  new THREE.CylinderGeometry(0.42, 0.52, 0.45, 12),
  hatMat
);
hatTop.position.y = 2.3;
pirate.add(hatTop);

// Hat skull emblem (tiny white sphere)
const emblem = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 10, 8),
  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
);
emblem.position.set(0, 2.28, 0.53);
pirate.add(emblem);

// Arms — left arm holding sword out, right arm at side
const armL = new THREE.Group();
const armLUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.8, 8), coatMat);
armLUpper.position.y = -0.4;
armL.add(armLUpper);
const armLHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMat);
armLHand.position.y = -0.85;
armL.add(armLHand);
armL.position.set(-0.9, 0.9, 0.1);
armL.rotation.z = -0.55;
pirate.add(armL);

const armR = new THREE.Group();
const armRUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.8, 8), coatMat);
armRUpper.position.y = -0.4;
armR.add(armRUpper);
const armRHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMat);
armRHand.position.y = -0.85;
armR.add(armRHand);
armR.position.set(0.9, 0.9, 0.1);
armR.rotation.z = 0.9;   // raised up holding sword
armR.rotation.x = -0.4;
pirate.add(armR);

// Sword — held by right hand, pointing up-right
const sword = new THREE.Group();
const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.7, 0.02), bladeMat);
blade.position.y = 0.85;
sword.add(blade);
const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.1), hiltMat);
guard.position.y = 0;
sword.add(guard);
const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), bootMat);
grip.position.y = -0.18;
sword.add(grip);
const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), hiltMat);
pommel.position.y = -0.35;
sword.add(pommel);

// Position sword at right hand, angled outward
sword.position.set(0.9, 0.9, 0.1);
sword.position.x += Math.sin(0.9) * 0.85;
sword.position.y += -Math.cos(0.9) * 0.85;
sword.rotation.z = 0.9 - 0.3;
sword.rotation.x = -0.4;
pirate.add(sword);

// Parrot on left shoulder
const parrot = new THREE.Group();
const parrotBody = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 10),
  new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.5, emissive: 0xff6b9d, emissiveIntensity: 0.25 })
);
parrotBody.scale.set(1, 1.1, 1.3);
parrot.add(parrotBody);
const parrotHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.13, 12, 10),
  new THREE.MeshStandardMaterial({ color: 0x4facfe, roughness: 0.5, emissive: 0x4facfe, emissiveIntensity: 0.25 })
);
parrotHead.position.set(0, 0.18, 0.2);
parrot.add(parrotHead);
const parrotBeak = new THREE.Mesh(
  new THREE.ConeGeometry(0.05, 0.14, 6),
  new THREE.MeshStandardMaterial({ color: 0xfee140, roughness: 0.3, emissive: 0xfee140, emissiveIntensity: 0.3 })
);
parrotBeak.position.set(0, 0.16, 0.33);
parrotBeak.rotation.x = Math.PI / 2;
parrot.add(parrotBeak);
const parrotWing = new THREE.Mesh(
  new THREE.ConeGeometry(0.14, 0.35, 3),
  new THREE.MeshStandardMaterial({ color: 0xc44cf7, roughness: 0.5, emissive: 0xc44cf7, emissiveIntensity: 0.3 })
);
parrotWing.position.set(-0.18, 0.05, 0);
parrotWing.rotation.z = 1.2;
parrot.add(parrotWing);
parrot.position.set(-0.65, 1.7, 0);
parrot.userData = { flapPhase: 0 };
pirate.add(parrot);

// Hook hand — replace left hand with a hook (pirates gotta pirate)
armLHand.visible = false;
const hook = new THREE.Mesh(
  new THREE.TorusGeometry(0.12, 0.035, 6, 20, Math.PI * 1.4),
  new THREE.MeshStandardMaterial({ color: 0xdde4ed, roughness: 0.2, metalness: 1, emissive: 0x4facfe, emissiveIntensity: 0.2 })
);
hook.position.set(-0.9 + Math.sin(-0.55) * 0.9, 0.9 - Math.cos(-0.55) * 0.9, 0.1);
hook.rotation.z = -0.55 + Math.PI / 2;
pirate.add(hook);

// Lift whole pirate so he sits centered in the frame
pirate.position.y = 0.2;
pirate.scale.setScalar(1.15);

logoGroup.rotation.x = -0.05;

// Legacy compatibility (unused)
const orbA = null;
const orbB = null;

// References for animation
const pirateRefs = { pirate, armR, sword, parrot, parrotWing, head };

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

  // ===== PIRATE: idle animation =====
  // (No draw-in needed — pirate appears immediately)
  logoParts.forEach((part) => {
    const elapsed = t - part.introStart;
    const p = Math.max(0, Math.min(1, elapsed / part.introDuration));
    const drawT = 1 - Math.pow(1 - p, 3);
    part.mainGeo.setDrawRange(0, Math.floor(part.totalMain * drawT));
    part.glowGeo.setDrawRange(0, Math.floor(part.totalGlow * drawT));
    part.glowMat.opacity = drawT * (0.22 + Math.sin(t * 2) * 0.1);
  });

  // Pirate head: subtle look-around
  pirateRefs.head.rotation.y = Math.sin(t * 0.6) * 0.25;
  pirateRefs.head.rotation.x = Math.sin(t * 0.4) * 0.08;

  // Sword: gentle swaying
  pirateRefs.armR.rotation.z = 0.9 + Math.sin(t * 1.2) * 0.08;
  pirateRefs.sword.rotation.z = (0.9 - 0.3) + Math.sin(t * 1.2) * 0.08;

  // Parrot: wing flap + slight bob
  pirateRefs.parrotWing.rotation.x = Math.sin(t * 8) * 0.5;
  pirateRefs.parrot.position.y = 1.7 + Math.sin(t * 3) * 0.04;

  // Whole pirate: gentle swaying (like standing on a ship deck)
  logoGroup.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  logoGroup.rotation.x = -0.05 + Math.sin(t * 0.5) * 0.04;
  logoGroup.rotation.y = Math.sin(t * 0.35) * 0.15;
  logoGroup.position.y = Math.sin(t * 0.7) * 0.1;

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

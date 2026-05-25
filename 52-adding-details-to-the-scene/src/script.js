import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// Pole light materials (one per lantern so they flicker independently)
const poleLightMaterialA = new THREE.MeshBasicMaterial({ color: 0xffffe5 });
const poleLightMaterialB = new THREE.MeshBasicMaterial({ color: 0xffffe5 });
const poleLightBaseColor = new THREE.Color(0xffffe5);

// Portal material
const portalMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(0x000000) },
    uColorEnd: { value: new THREE.Color(0xffffff) },
  },
});

gui.addColor(portalMaterial.uniforms.uColorStart, "value").name("portal color start");
gui.addColor(portalMaterial.uniforms.uColorEnd, "value").name("portal color end");

/**
 * Model
 */
let portalLightMesh = null;
let bakedMesh = null;
let poleLightAMesh = null;
let poleLightBMesh = null;
gltfLoader.load("portal.glb", (gltf) => {
  scene.add(gltf.scene);

  // Get each object
  bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  portalLightMesh = gltf.scene.children.find(
    (child) => child.name === "portalLight",
  );
  poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightA",
  );
  poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightB",
  );

  // Apply materials
  bakedMesh.material = bakedMaterial;
  portalLightMesh.material = portalMaterial;
  poleLightAMesh.material = poleLightMaterialA;
  poleLightBMesh.material = poleLightMaterialB;

  // Snap the ground spill to sit directly under the portal mesh
  const portalWorldPos = new THREE.Vector3();
  portalLightMesh.getWorldPosition(portalWorldPos);
  groundSpill.position.x = portalWorldPos.x;
  groundSpill.position.z = portalWorldPos.z;
});

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scaleArray[i] = Math.random() * 0.5 + 0.1;
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3),
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1),
);
const firefliesHomePositions = new Float32Array(positionArray);

const firefliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100.0 },
    uTime: { value: 0 },
  },
});

gui.add(firefliesMaterial.uniforms.uSize, "value").min(0).max(500).step(1).name("fireflies size");

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Ground fog
 */
const fogGeometry = new THREE.PlaneGeometry(8, 8, 64, 64);
const fogMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x8888aa) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vUv * 3.0;
      float n = noise(uv + uTime * 0.05);
      n += noise(uv * 2.0 - uTime * 0.07) * 0.5;
      n /= 1.5;
      float edge = 1.0 - smoothstep(0.3, 0.5, distance(vUv, vec2(0.5)));
      float alpha = n * edge * 0.6;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
});
const groundFog = new THREE.Mesh(fogGeometry, fogMaterial);
groundFog.rotation.x = -Math.PI / 2;
groundFog.position.y = 0.05;
scene.add(groundFog);

gui.addColor(fogMaterial.uniforms.uColor, "value").name("fog color");

/**
 * Portal ground light spill — soft additive disc below the portal,
 * pulses gently and picks up the portal's end color
 */
const spillGeometry = new THREE.PlaneGeometry(2.5, 2.5);
const spillMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: portalMaterial.uniforms.uColorEnd.value },
    uIntensity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      float d = distance(vUv, vec2(0.5));
      float disc = 1.0 - smoothstep(0.0, 0.5, d);
      disc = pow(disc, 2.0);
      float pulse = 0.85 + sin(uTime * 1.8) * 0.15;
      gl_FragColor = vec4(uColor * pulse * uIntensity, disc * 0.7);
    }
  `,
});
const groundSpill = new THREE.Mesh(spillGeometry, spillMaterial);
groundSpill.rotation.x = -Math.PI / 2;
groundSpill.position.set(0, 0.02, 1.6); // sits at the portal's foot; tweak if your portal is elsewhere
scene.add(groundSpill);

gui.add(groundSpill.position, "z").min(-3).max(3).step(0.05).name("spill z");
gui.add(spillMaterial.uniforms.uIntensity, "value").min(0).max(3).step(0.05).name("spill intensity");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2,
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = "#201919";
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Interactive portal burst
 */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let burstTime = -1; // -1 = inactive; otherwise seconds elapsed since trigger
const BURST_DURATION = 1.2;

const originalPortalEnd = portalMaterial.uniforms.uColorEnd.value.clone();
const originalPortalStart = portalMaterial.uniforms.uColorStart.value.clone();

function triggerBurst() {
  burstTime = 0;
  // Scatter fireflies outward from the portal
  const pos = firefliesGeometry.attributes.position.array;
  for (let i = 0; i < firefliesCount; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5),
      Math.random() * 0.5 + 0.2,
      (Math.random() - 0.5),
    ).normalize();
    pos[i * 3 + 0] = firefliesHomePositions[i * 3 + 0] + dir.x * 1.5;
    pos[i * 3 + 1] = firefliesHomePositions[i * 3 + 1] + dir.y * 1.0;
    pos[i * 3 + 2] = firefliesHomePositions[i * 3 + 2] + dir.z * 1.5;
  }
  firefliesGeometry.attributes.position.needsUpdate = true;
}

/**
 * Audio — synthesized via Web Audio API (no asset files)
 * - Ambient hum: low sine tone, always running
 * - Upside Down drone: detuned dissonant pad, only in alt mood
 * - Portal whoosh: filtered noise burst, on click
 * - Portal charge: rising tone while holding the portal
 */
let audioCtx = null;
let ambientHumGain = null;
let upsideDownGain = null;
let chargeOsc = null;
let chargeGain = null;
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Ambient hum — soft low sine
  const humOsc = audioCtx.createOscillator();
  humOsc.type = "sine";
  humOsc.frequency.value = 60;
  const humOsc2 = audioCtx.createOscillator();
  humOsc2.type = "sine";
  humOsc2.frequency.value = 90;
  ambientHumGain = audioCtx.createGain();
  ambientHumGain.gain.value = 0.04;
  humOsc.connect(ambientHumGain);
  humOsc2.connect(ambientHumGain);
  ambientHumGain.connect(audioCtx.destination);
  humOsc.start();
  humOsc2.start();

  // Upside Down drone — detuned saws through a low-pass
  const droneA = audioCtx.createOscillator();
  droneA.type = "sawtooth";
  droneA.frequency.value = 55;
  const droneB = audioCtx.createOscillator();
  droneB.type = "sawtooth";
  droneB.frequency.value = 55 * 1.06; // slight detune
  const droneC = audioCtx.createOscillator();
  droneC.type = "sawtooth";
  droneC.frequency.value = 82;
  const droneFilter = audioCtx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 300;
  upsideDownGain = audioCtx.createGain();
  upsideDownGain.gain.value = 0;
  droneA.connect(droneFilter);
  droneB.connect(droneFilter);
  droneC.connect(droneFilter);
  droneFilter.connect(upsideDownGain);
  upsideDownGain.connect(audioCtx.destination);
  droneA.start();
  droneB.start();
  droneC.start();

  // Slow LFO on drone filter for movement
  const lfo = audioCtx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(droneFilter.frequency);
  lfo.start();
}

function playWhoosh() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.6;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.6);
  filter.Q.value = 2;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.3;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

function startCharge() {
  if (!audioCtx || chargeOsc) return;
  chargeOsc = audioCtx.createOscillator();
  chargeOsc.type = "triangle";
  chargeOsc.frequency.value = 120;
  chargeOsc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + CHARGE_DURATION);
  chargeGain = audioCtx.createGain();
  chargeGain.gain.value = 0;
  chargeGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + CHARGE_DURATION);
  chargeOsc.connect(chargeGain);
  chargeGain.connect(audioCtx.destination);
  chargeOsc.start();
}

function stopCharge() {
  if (!chargeOsc) return;
  const now = audioCtx.currentTime;
  chargeGain.gain.cancelScheduledValues(now);
  chargeGain.gain.setValueAtTime(chargeGain.gain.value, now);
  chargeGain.gain.linearRampToValueAtTime(0, now + 0.1);
  chargeOsc.stop(now + 0.1);
  chargeOsc = null;
  chargeGain = null;
}

/**
 * Upside Down mood swap (Stranger Things style)
 * Click portal -> fade to black -> world reappears washed-out, red-tinted, dimmer, slower.
 * Click portal again -> fade back.
 */
// Full-screen black overlay for the fade
const fadeEl = document.createElement("div");
fadeEl.style.cssText = "position:fixed;inset:0;background:#000;pointer-events:none;opacity:0;transition:none;z-index:10;";
document.body.appendChild(fadeEl);

// On-screen hint
const hintEl = document.createElement("div");
hintEl.textContent = "Click and hold the portal";
hintEl.style.cssText = [
  "position:fixed",
  "left:50%",
  "bottom:48px",
  "transform:translateX(-50%)",
  "padding:10px 18px",
  "border-radius:999px",
  "background:rgba(0,0,0,0.45)",
  "color:#fff",
  "font:500 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  "letter-spacing:0.04em",
  "pointer-events:none",
  "opacity:0",
  "transition:opacity 0.6s ease",
  "backdrop-filter:blur(6px)",
  "-webkit-backdrop-filter:blur(6px)",
  "z-index:11",
].join(";");
document.body.appendChild(hintEl);
// Fade in after a short delay so the user sees the scene first
setTimeout(() => { hintEl.style.opacity = "1"; }, 1200);

let hintDismissed = false;
function dismissHint() {
  if (hintDismissed) return;
  hintDismissed = true;
  hintEl.style.opacity = "0";
  setTimeout(() => hintEl.remove(), 600);
}

const FADE_DURATION = 1.4;
let fadeTime = -1;
let fadeDirection = 1; // 1 = fading to black, -1 = fading back
let inUpsideDown = false;
const camStartPos = new THREE.Vector3();
const camPortalPos = new THREE.Vector3(0, 0.8, 1.0); // close to portal

// Original mood
const originalPortalStartCol = portalMaterial.uniforms.uColorStart.value.clone();
const originalPortalEndCol = portalMaterial.uniforms.uColorEnd.value.clone();
const originalClearColor = new THREE.Color(debugObject.clearColor);
const originalFogColor = fogMaterial.uniforms.uColor.value.clone();
const originalLanternColor = poleLightBaseColor.clone();
const originalBakedColor = bakedMaterial.color.clone();

// Upside Down mood — desaturated reds, sickly green portal, blood-red fog
const upPortalStart = new THREE.Color(0x1a0000);
const upPortalEnd = new THREE.Color(0x7a1a1a);
const upClearColor = new THREE.Color(0x0a0202);
const upFogColor = new THREE.Color(0x4a0a0a);
const upLanternColor = new THREE.Color(0x552020); // dim, red
const upBakedTint = new THREE.Color(0x886060); // multiplied with texture to wash out

// Ash particles (only visible in Upside Down)
const ashCount = 200;
const ashGeometry = new THREE.BufferGeometry();
const ashPos = new Float32Array(ashCount * 3);
const ashSeed = new Float32Array(ashCount);
for (let i = 0; i < ashCount; i++) {
  ashPos[i * 3 + 0] = (Math.random() - 0.5) * 8;
  ashPos[i * 3 + 1] = Math.random() * 5;
  ashPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  ashSeed[i] = Math.random();
}
ashGeometry.setAttribute("position", new THREE.BufferAttribute(ashPos, 3));
ashGeometry.setAttribute("aSeed", new THREE.BufferAttribute(ashSeed, 1));
const ashMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aSeed;
    void main() {
      vec3 pos = position;
      // slow downward drift, wrapped
      pos.y = mod(pos.y - uTime * 0.15 + aSeed * 5.0, 5.0);
      pos.x += sin(uTime * 0.3 + aSeed * 10.0) * 0.2;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = 3.0 * uPixelRatio * (0.5 + aSeed);
      gl_PointSize *= (1.0 / -mv.z);
    }
  `,
  fragmentShader: `
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      float strength = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(0.6, 0.4, 0.4, strength * 0.6);
    }
  `,
});
const ash = new THREE.Points(ashGeometry, ashMaterial);
ash.visible = false;
scene.add(ash);

function applyMood(mood) {
  // mood = 0 (original) to 1 (full Upside Down) — but we just snap at midpoint of fade
  if (mood === 1) {
    portalMaterial.uniforms.uColorStart.value.copy(upPortalStart);
    portalMaterial.uniforms.uColorEnd.value.copy(upPortalEnd);
    renderer.setClearColor(upClearColor);
    fogMaterial.uniforms.uColor.value.copy(upFogColor);
    poleLightBaseColor.copy(upLanternColor);
    bakedMaterial.color.copy(upBakedTint);
    ash.visible = true;
    originalPortalStart.copy(upPortalStart);
    originalPortalEnd.copy(upPortalEnd);
  } else {
    portalMaterial.uniforms.uColorStart.value.copy(originalPortalStartCol);
    portalMaterial.uniforms.uColorEnd.value.copy(originalPortalEndCol);
    renderer.setClearColor(originalClearColor);
    fogMaterial.uniforms.uColor.value.copy(originalFogColor);
    poleLightBaseColor.copy(originalLanternColor);
    bakedMaterial.color.copy(originalBakedColor);
    ash.visible = false;
    originalPortalStart.copy(originalPortalStartCol);
    originalPortalEnd.copy(originalPortalEndCol);
  }
}

let moodSwapped = false;

/**
 * Click-and-hold portal: hold to charge, release (or auto-fire at full charge) to swap.
 */
const CHARGE_DURATION = 1.2; // seconds to fully charge
let chargeTime = -1; // -1 = not charging
let chargingPortal = false;

function triggerSwap() {
  triggerBurst();
  playWhoosh();
  fadeTime = 0;
  fadeDirection = inUpsideDown ? -1 : 1;
  moodSwapped = false;
  camStartPos.copy(camera.position);
  controls.enabled = false;
}

window.addEventListener("pointerdown", (e) => {
  initAudio();
  if (!portalLightMesh || fadeTime >= 0) return;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(portalLightMesh);
  if (hits.length === 0) return;

  chargingPortal = true;
  chargeTime = 0;
  startCharge();
  dismissHint();
});

const QUICK_TAP_THRESHOLD = 0.25; // seconds — release within this window = treat as tap
function endCharge() {
  if (!chargingPortal) return;
  const heldFor = chargeTime;
  const wasReady = heldFor >= CHARGE_DURATION;
  const wasQuickTap = heldFor < QUICK_TAP_THRESHOLD;
  chargingPortal = false;
  chargeTime = -1;
  stopCharge();
  // restore portal colors if released before swap
  portalMaterial.uniforms.uColorStart.value.copy(originalPortalStart);
  portalMaterial.uniforms.uColorEnd.value.copy(originalPortalEnd);
  if (wasReady || wasQuickTap) triggerSwap();
}

window.addEventListener("pointerup", endCharge);
window.addEventListener("pointercancel", endCharge);

/**
 * Mouse parallax — camera subtly offsets based on cursor position
 */
const mouseNorm = new THREE.Vector2(0, 0);
const parallaxOffset = new THREE.Vector3();
window.addEventListener("pointermove", (e) => {
  mouseNorm.x = (e.clientX / sizes.width) * 2 - 1;
  mouseNorm.y = -(e.clientY / sizes.height) * 2 + 1;
});

/**
 * Reality glitches — random brief Upside Down flickers in the normal world
 */
let glitchTime = -1;
let glitchDuration = 0;
let nextGlitchAt = 8 + Math.random() * 20;
let preGlitchState = null;

function triggerGlitch() {
  if (inUpsideDown) return;
  glitchTime = 0;
  glitchDuration = 0.15 + Math.random() * 0.25;
  preGlitchState = {
    pStart: portalMaterial.uniforms.uColorStart.value.clone(),
    pEnd: portalMaterial.uniforms.uColorEnd.value.clone(),
    fog: fogMaterial.uniforms.uColor.value.clone(),
    lantern: poleLightBaseColor.clone(),
    baked: bakedMaterial.color.clone(),
  };
  portalMaterial.uniforms.uColorStart.value.copy(upPortalStart);
  portalMaterial.uniforms.uColorEnd.value.copy(upPortalEnd);
  fogMaterial.uniforms.uColor.value.copy(upFogColor);
  poleLightBaseColor.copy(upLanternColor);
  bakedMaterial.color.copy(upBakedTint);
  ash.visible = true;
  if (audioCtx) playWhoosh(); // brief noise burst
}

function endGlitch() {
  if (!preGlitchState) return;
  portalMaterial.uniforms.uColorStart.value.copy(preGlitchState.pStart);
  portalMaterial.uniforms.uColorEnd.value.copy(preGlitchState.pEnd);
  originalPortalStart.copy(preGlitchState.pStart);
  originalPortalEnd.copy(preGlitchState.pEnd);
  fogMaterial.uniforms.uColor.value.copy(preGlitchState.fog);
  poleLightBaseColor.copy(preGlitchState.lantern);
  bakedMaterial.color.copy(preGlitchState.baked);
  ash.visible = false;
  preGlitchState = null;
  glitchTime = -1;
}

/**
 * Lightning — bright flash overlay used in Upside Down
 */
const lightningEl = document.createElement("div");
lightningEl.style.cssText = "position:fixed;inset:0;background:#ffdddd;pointer-events:none;opacity:0;z-index:9;mix-blend-mode:screen;";
document.body.appendChild(lightningEl);
let lightningTime = -1;
let nextLightningAt = 6 + Math.random() * 15;

function triggerLightning() {
  lightningTime = 0;
  // Play thunder
  if (audioCtx) {
    const bufferSize = audioCtx.sampleRate * 1.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.4;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(audioCtx.currentTime + 0.1); // thunder lags the flash a bit
  }
}

/**
 * Animate
 */
const clock = new THREE.Clock();
let prevTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const dt = elapsedTime - prevTime;
  prevTime = elapsedTime;

  // Slower firefly animation speed in Upside Down
  const fireflySpeedScale = inUpsideDown ? 0.3 : 1.0;
  firefliesMaterial.uniforms.uTime.value = elapsedTime * fireflySpeedScale;
  portalMaterial.uniforms.uTime.value = elapsedTime * (inUpsideDown ? 0.5 : 1.0);
  fogMaterial.uniforms.uTime.value = elapsedTime;
  ashMaterial.uniforms.uTime.value = elapsedTime;
  spillMaterial.uniforms.uTime.value = elapsedTime;

  // Portal burst animation
  if (burstTime >= 0) {
    burstTime += dt;
    const t = burstTime / BURST_DURATION;
    if (t >= 1) {
      burstTime = -1;
      portalMaterial.uniforms.uColorStart.value.copy(originalPortalStart);
      portalMaterial.uniforms.uColorEnd.value.copy(originalPortalEnd);
    } else {
      // Flash portal toward white then back
      const flash = Math.sin(t * Math.PI);
      portalMaterial.uniforms.uColorStart.value
        .copy(originalPortalStart)
        .lerp(new THREE.Color(0xffffff), flash);
      portalMaterial.uniforms.uColorEnd.value
        .copy(originalPortalEnd)
        .lerp(new THREE.Color(0xffffff), flash);
      // Pull fireflies back toward home as burst fades
      const pos = firefliesGeometry.attributes.position.array;
      const ret = 1.0 - Math.pow(1.0 - t, 2);
      for (let i = 0; i < firefliesCount; i++) {
        for (let j = 0; j < 3; j++) {
          const k = i * 3 + j;
          pos[k] = pos[k] + (firefliesHomePositions[k] - pos[k]) * ret * 0.15;
        }
      }
      firefliesGeometry.attributes.position.needsUpdate = true;
      // Camera shake
      const shake = (1.0 - t) * 0.05;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      camera.position.z += (Math.random() - 0.5) * shake;
    }
  }

  // Lantern flicker — irregular candle-like: layered noise + occasional sharp dips
  const flicker = (seed) => {
    const t = elapsedTime + seed;
    let v = 0.7
      + Math.sin(t * 7.3) * 0.12
      + Math.sin(t * 17.7 + seed) * 0.08
      + Math.sin(t * 31.1 + seed * 2.0) * 0.05
      + (Math.random() - 0.5) * 0.18;
    // occasional sharp dip (like a draft hitting the flame)
    if (Math.random() < 0.02) v *= 0.4 + Math.random() * 0.3;
    return Math.max(0.2, Math.min(1.2, v));
  };
  poleLightMaterialA.color.copy(poleLightBaseColor).multiplyScalar(flicker(0));
  poleLightMaterialB.color.copy(poleLightBaseColor).multiplyScalar(flicker(13.7));

  // Portal charging while held
  if (chargingPortal) {
    chargeTime += dt;
    const c = Math.min(chargeTime / CHARGE_DURATION, 1);
    // Intensify portal: lerp end color toward white, start toward portal-end color
    const chargeWhite = new THREE.Color(0xffffff);
    portalMaterial.uniforms.uColorStart.value
      .copy(originalPortalStart)
      .lerp(originalPortalEnd, c);
    portalMaterial.uniforms.uColorEnd.value
      .copy(originalPortalEnd)
      .lerp(chargeWhite, c);
    // Pull fireflies toward portal
    const pos = firefliesGeometry.attributes.position.array;
    for (let i = 0; i < firefliesCount; i++) {
      const tx = 0, ty = 0.8, tz = 0; // portal center approx
      pos[i * 3 + 0] += (tx - pos[i * 3 + 0]) * 0.02 * c;
      pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * 0.02 * c;
      pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * 0.02 * c;
    }
    firefliesGeometry.attributes.position.needsUpdate = true;
    // Auto-fire when fully charged
    if (c >= 1) {
      chargingPortal = false;
      chargeTime = -1;
      stopCharge();
      triggerSwap();
    }
  }

  // Crossfade upside-down drone in/out based on mood
  if (upsideDownGain) {
    const target = inUpsideDown ? 0.06 : 0;
    upsideDownGain.gain.value += (target - upsideDownGain.gain.value) * 0.02;
  }

  // Fade-to-black mood swap with camera fly-through
  if (fadeTime >= 0) {
    fadeTime += dt;
    const t = Math.min(fadeTime / FADE_DURATION, 1);
    const opacity = t < 0.5 ? t * 2 : (1 - t) * 2;
    fadeEl.style.opacity = String(opacity);

    // Camera motion: first half flies toward portal, second half pulls back out
    if (t < 0.5) {
      const e = t * 2; // 0..1
      const ease = e * e * (3 - 2 * e);
      camera.position.lerpVectors(camStartPos, camPortalPos, ease);
      camera.lookAt(0, 0.6, 0);
    } else {
      const e = (t - 0.5) * 2; // 0..1
      const ease = e * e * (3 - 2 * e);
      camera.position.lerpVectors(camPortalPos, camStartPos, ease);
      camera.lookAt(0, 0.6, 0);
    }

    // Swap the mood at midpoint when screen is fully black
    if (!moodSwapped && t >= 0.5) {
      moodSwapped = true;
      inUpsideDown = fadeDirection === 1;
      applyMood(inUpsideDown ? 1 : 0);
    }

    if (t >= 1) {
      fadeTime = -1;
      fadeEl.style.opacity = "0";
      controls.enabled = true;
    }
  }

  // Mouse parallax (skip while traveling)
  if (fadeTime < 0 && controls.enabled) {
    const targetX = mouseNorm.x * 0.15;
    const targetY = mouseNorm.y * 0.1;
    parallaxOffset.x += (targetX - parallaxOffset.x) * 0.05;
    parallaxOffset.y += (targetY - parallaxOffset.y) * 0.05;
    camera.position.x += (parallaxOffset.x - (camera.userData.lastParallaxX || 0));
    camera.position.y += (parallaxOffset.y - (camera.userData.lastParallaxY || 0));
    camera.userData.lastParallaxX = parallaxOffset.x;
    camera.userData.lastParallaxY = parallaxOffset.y;
  }

  // Reality glitches — random brief Upside Down flickers
  if (!inUpsideDown && fadeTime < 0) {
    if (glitchTime < 0) {
      nextGlitchAt -= dt;
      if (nextGlitchAt <= 0) {
        triggerGlitch();
        nextGlitchAt = 8 + Math.random() * 20;
      }
    } else {
      glitchTime += dt;
      if (glitchTime >= glitchDuration) endGlitch();
    }
  } else if (glitchTime >= 0) {
    endGlitch();
  }

  // Lightning in Upside Down
  if (inUpsideDown) {
    if (lightningTime < 0) {
      nextLightningAt -= dt;
      if (nextLightningAt <= 0) {
        triggerLightning();
        nextLightningAt = 6 + Math.random() * 15;
      }
    } else {
      lightningTime += dt;
      // Flash envelope: sharp rise, two-spike pattern, fade
      const flashEnv =
        Math.max(0, 1 - lightningTime * 8) +
        Math.max(0, 0.6 - Math.abs(lightningTime - 0.12) * 6) +
        Math.max(0, 0.4 - Math.abs(lightningTime - 0.25) * 4);
      lightningEl.style.opacity = String(Math.min(1, flashEnv));
      if (lightningTime > 0.6) {
        lightningTime = -1;
        lightningEl.style.opacity = "0";
      }
    }
  } else {
    lightningEl.style.opacity = "0";
    lightningTime = -1;
  }

  // Heartbeat pulse while charging — subtle scene scale + low audio thump
  if (chargingPortal) {
    const c = Math.min(chargeTime / CHARGE_DURATION, 1);
    const beat = 1 + Math.sin(elapsedTime * (4 + c * 8)) * 0.01 * c;
    camera.zoom = beat;
    camera.updateProjectionMatrix();
  } else if (camera.zoom !== 1) {
    camera.zoom += (1 - camera.zoom) * 0.1;
    camera.updateProjectionMatrix();
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

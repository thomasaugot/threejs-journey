import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { dot } from "three/tsl";
import TintVertexShader from "./passes/tint/vertex.glsl";
import TintFragmentShader from "./passes/tint/fragment.glsl";
import WaveVertexShader from "./passes/wave/vertex.glsl";
import WaveFragmentShader from "./passes/wave/fragment.glsl";
import CrtVertexShader from "./passes/crt/vertex.glsl";
import CrtFragmentShader from "./passes/crt/fragment.glsl";
import PixelateVertexShader from "./passes/pixelate/vertex.glsl";
import PixelateFragmentShader from "./passes/pixelate/fragment.glsl";
import VignetteVertexShader from "./passes/vignette/vertex.glsl";
import VignetteFragmentShader from "./passes/vignette/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      child.material.envMapIntensity = 2.5;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg",
]);

scene.background = environmentMap;
scene.environment = environmentMap;

/**
 * Models
 */
gltfLoader.load("/models/DamagedHelmet/glTF/DamagedHelmet.gltf", (gltf) => {
  gltf.scene.scale.set(2, 2, 2);
  gltf.scene.rotation.y = Math.PI * 0.5;
  scene.add(gltf.scene);

  updateAllMaterials();
});

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

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

  // Update effect composer
  effectComposer.setSize(sizes.width, sizes.height);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true, // wont work anymore because we are using post processing, but we will use the render target to do antialiasing instead
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Post processing
 */
// Render target
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  samples: renderer.getPixelRatio() === 1 ? 2 : 0, // this is for antialiasing - only works if the device supports it, and if the renderer has antialias set to true. we only set it for browsers that need it because its bad for performance
});

const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(sizes.width, sizes.height);

const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

const dotScreenPass = new DotScreenPass();
dotScreenPass.enabled = false;
effectComposer.addPass(dotScreenPass);

const glitchPass = new GlitchPass();
glitchPass.goWild = false;
glitchPass.enabled = false;
effectComposer.addPass(glitchPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.enabled = false;
effectComposer.addPass(rgbShiftPass);

const unrealBloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  1.5,
  0.4,
  0.85,
);
unrealBloomPass.enabled = false;
effectComposer.addPass(unrealBloomPass);

// this one to ensure the scene isnt so dark - make sure its always past the previous passes
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
gammaCorrectionPass.enabled = true;
effectComposer.addPass(gammaCorrectionPass);

// Tint pass
const TintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
  },
  vertexShader: TintVertexShader,
  fragmentShader: TintFragmentShader,
};
const tintPass = new ShaderPass(TintShader);
tintPass.uniforms.uTint.value = new THREE.Color(0.2, 0, 0); // Red tint
tintPass.enabled = false;
effectComposer.addPass(tintPass);

const tintFolder = gui.addFolder("Tint");
tintFolder.add(tintPass, "enabled").name("Enabled");
tintFolder.add(tintPass.uniforms.uTint.value, "r").min(0).max(1).step(0.001).name("Tint Red");
tintFolder.add(tintPass.uniforms.uTint.value, "g").min(0).max(1).step(0.001).name("Tint Green");
tintFolder.add(tintPass.uniforms.uTint.value, "b").min(0).max(1).step(0.001).name("Tint Blue");

// Wave pass — drunk effect
const WaveShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uFrequency: { value: 10 },
    uAmplitude: { value: 0.015 },
  },
  vertexShader: WaveVertexShader,
  fragmentShader: WaveFragmentShader,
};
const wavePass = new ShaderPass(WaveShader);
wavePass.enabled = false;
effectComposer.addPass(wavePass);

const waveFolder = gui.addFolder("Wave (drunk)");
waveFolder.add(wavePass, "enabled").name("Enabled");
waveFolder.add(wavePass.uniforms.uFrequency, "value").min(0).max(50).step(0.1).name("Frequency");
waveFolder.add(wavePass.uniforms.uAmplitude, "value").min(0).max(0.1).step(0.001).name("Amplitude");

// Pixelate pass — 8-bit retro
const PixelateShader = {
  uniforms: {
    tDiffuse: { value: null },
    uPixelCount: { value: 200 },
  },
  vertexShader: PixelateVertexShader,
  fragmentShader: PixelateFragmentShader,
};
const pixelatePass = new ShaderPass(PixelateShader);
pixelatePass.enabled = false;
effectComposer.addPass(pixelatePass);

const pixelateFolder = gui.addFolder("Pixelate");
pixelateFolder.add(pixelatePass, "enabled").name("Enabled");
pixelateFolder.add(pixelatePass.uniforms.uPixelCount, "value").min(20).max(800).step(1).name("Pixel Count");

// CRT pass — scanlines + curved screen
const CrtShader = {
  uniforms: {
    tDiffuse: { value: null },
    uScanlineCount: { value: 800 },
    uScanlineIntensity: { value: 0.4 },
    uCurvature: { value: 1.0 },
  },
  vertexShader: CrtVertexShader,
  fragmentShader: CrtFragmentShader,
};
const crtPass = new ShaderPass(CrtShader);
crtPass.enabled = false;
effectComposer.addPass(crtPass);

const crtFolder = gui.addFolder("CRT");
crtFolder.add(crtPass, "enabled").name("Enabled");
crtFolder.add(crtPass.uniforms.uScanlineCount, "value").min(100).max(2000).step(10).name("Scanline Count");
crtFolder.add(crtPass.uniforms.uScanlineIntensity, "value").min(0).max(1).step(0.01).name("Scanline Intensity");
crtFolder.add(crtPass.uniforms.uCurvature, "value").min(0).max(3).step(0.01).name("Curvature");

// Vignette + film grain pass
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignetteIntensity: { value: 0.6 },
    uGrainIntensity: { value: 0.08 },
  },
  vertexShader: VignetteVertexShader,
  fragmentShader: VignetteFragmentShader,
};
const vignettePass = new ShaderPass(VignetteShader);
vignettePass.enabled = false;
effectComposer.addPass(vignettePass);

const vignetteFolder = gui.addFolder("Vignette + Grain");
vignetteFolder.add(vignettePass, "enabled").name("Enabled");
vignetteFolder.add(vignettePass.uniforms.uVignetteIntensity, "value").min(0).max(1).step(0.01).name("Vignette");
vignetteFolder.add(vignettePass.uniforms.uGrainIntensity, "value").min(0).max(0.3).step(0.001).name("Grain");

// this pass is the one that will do antialiasing, so we want it to be the last one in the chain, and we want to make sure its enabled only if the device supports it, and if the renderer has antialias set to true
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
  const smaaPass = new SMAAPass();
  effectComposer.addPass(smaaPass);
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Update wave pass
  wavePass.uniforms.uTime.value = elapsedTime;

  // Update vignette/grain pass
  vignettePass.uniforms.uTime.value = elapsedTime;

  // Render
  effectComposer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

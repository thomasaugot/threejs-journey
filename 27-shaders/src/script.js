import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import testVertexShader from "./shaders/test/vertex.glsl";
import testFragmentShader from "./shaders/test/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();
const debugObject = {
  waveFrequency: 10,
  waveSpeed: 3,
  waveAmplitude: 0.1,
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const frenchFlagTexture = textureLoader.load("/textures/flag-french.jpg");
frenchFlagTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

// Material
const material = new THREE.RawShaderMaterial({
  vertexShader: testVertexShader,
  fragmentShader: testFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uWaveFrequency: { value: debugObject.waveFrequency },
    uWaveSpeed: { value: debugObject.waveSpeed },
    uWaveAmplitude: { value: debugObject.waveAmplitude },
    uTexture: { value: frenchFlagTexture },
  },
});

gui.add(debugObject, "waveFrequency", 0, 30, 0.01).onChange((value) => {
  material.uniforms.uWaveFrequency.value = value;
});
gui.add(debugObject, "waveSpeed", 0, 10, 0.01).onChange((value) => {
  material.uniforms.uWaveSpeed.value = value;
});
gui.add(debugObject, "waveAmplitude", 0, 1, 0.001).onChange((value) => {
  material.uniforms.uWaveAmplitude.value = value;
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

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
camera.position.set(0.25, -0.25, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

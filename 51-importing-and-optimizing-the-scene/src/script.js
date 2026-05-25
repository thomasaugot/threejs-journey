import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as SPECTOR from "spectorjs";

/**
 * Spector JS
 */
const spector = new SPECTOR.Spector();
spector.displayUI();

/**
 * Base
 */
// Debug
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
const bakedTexture = textureLoader.load("scene_atlas.png");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

const emitTexture = textureLoader.load("scene_emit.png");
emitTexture.flipY = false;
emitTexture.encoding = THREE.sRGBEncoding;

/**
 * Model
 */
gltfLoader.load("/models/portal.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (!child.isMesh) return;

    const tex = textureLoader.load(
      `textures/${child.name}_bake.png`,
      undefined,
      undefined,
      () => console.warn(`No bake texture for mesh: ${child.name}`),
    );
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;

    child.material = new THREE.MeshBasicMaterial({ map: tex });
  });

  scene.add(gltf.scene);
});

/**
 * Materials
 */
// Baked Materials
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// Emission (portal + lamps share the emit atlas)
const emitMaterial = new THREE.MeshBasicMaterial({ map: emitTexture });

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

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

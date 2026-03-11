import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GroundedSkybox } from "three/addons/objects/GroundedSkybox.js";

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const exrLoader = new EXRLoader();
const textureLoader = new THREE.TextureLoader();

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
 * Environment map
 */
scene.environmentIntensity = 1;
scene.backgroundBlurriness = 0;
scene.backgroundIntensity = 1;
scene.backgroundRotation.x = 0;
scene.backgroundRotation.y = 0;
scene.backgroundRotation.z = 0;

gui.add(scene, "environmentIntensity").min(0).max(10).step(0.001);
gui.add(scene, "backgroundBlurriness").min(0).max(1).step(0.001);
gui.add(scene, "backgroundIntensity").min(0).max(10).step(0.001);
gui
  .add(scene.backgroundRotation, "x")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001)
  .name("backgroundRotationX");
gui
  .add(scene.backgroundRotation, "y")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001)
  .name("backgroundRotationY");
gui
  .add(scene.backgroundRotation, "z")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001)
  .name("backgroundRotationZ");

// // LDR cubemap
// const environmentMap = cubeTextureLoader.load([
//     '/environmentMaps/2/px.png',
//     '/environmentMaps/2/nx.png',
//     '/environmentMaps/2/py.png',
//     '/environmentMaps/2/ny.png',
//     '/environmentMaps/2/pz.png',
//     '/environmentMaps/2/nz.png'
// ]) // make sure we follow the right order of the images (px, nx, py, ny, pz, nz)

// scene.environment = environmentMap
// scene.background = environmentMap

// HDR equirectangular
// rgbeLoader.load(
//     '/environmentMaps/lightEnvMap.hdr',
//     (environmentMap) =>
//     {
//         environmentMap.mapping = THREE.EquirectangularReflectionMapping

//         scene.environment = environmentMap
//         // scene.background = environmentMap
//     }
// )

// const environnmentMap = textureLoader.load('/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg')
// environnmentMap.mapping = THREE.EquirectangularReflectionMapping
// environnmentMap.colorSpace = THREE.SRGBColorSpace

// scene.environment = environnmentMap
// scene.background = environnmentMap

// rgbeLoader.load("/environmentMaps/2/2k.hdr", (environmentMap) => {
//   environmentMap.mapping = THREE.EquirectangularReflectionMapping;

//   scene.environment = environmentMap;

//   const skybox = new GroundedSkybox(environmentMap, 15, 70);
// //   skybox.material.wireframe = true;
//   skybox.position.y = 15;
//     scene.add(skybox);
// });

/**
 * Realtime environment map
 */
const environmentMap = textureLoader.load(
  "/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg",
);
environmentMap.mapping = THREE.EquirectangularReflectionMapping;
environmentMap.colorSpace = THREE.SRGBColorSpace;

// scene.environment = environmentMap;
scene.background = environmentMap;

// Holy Donut
const holyDonut = new THREE.Mesh(
  new THREE.TorusGeometry(8, 0.5),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(10, 10, 10),
  }),
);

holyDonut.layers.enable(1);
holyDonut.position.y = 3.5;
scene.add(holyDonut);

// Cube render target
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.HalfFloatType,
});

scene.environment = cubeRenderTarget.texture;

// Cube camera
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeCamera.position.y = 4;
cubeCamera.layers.set(1);
scene.add(cubeCamera);

/**
 * Torus Knot
 */
const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
  new THREE.MeshStandardMaterial({
    roughness: 0,
    metalness: 1,
    color: 0xaaaaaa,
  }),
);
torusKnot.position.x = -4;
torusKnot.position.y = 4;
scene.add(torusKnot);

/**
 * Models
 */
gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", (gltf) => {
  const model = gltf.scene;
  model.scale.set(10, 10, 10);
  model.position.y = -1.5;
  scene.add(model);
});

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
camera.position.set(4, 5, 4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3.5;
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
  // Time
  const elapsedTime = clock.getElapsedTime();

  if (holyDonut) {
    holyDonut.rotation.x = elapsedTime * 0.5;
    cubeCamera.update(renderer, scene);
  }

  if (torusKnot) {
    torusKnot.rotation.y = elapsedTime * 0.9;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import slicedVertexShader from "./shaders/sliced/vertex.glsl";
import slicedFragmentShader from "./shaders/sliced/fragment.glsl";

/**
 * Base
 */
const gui = new GUI({ width: 325 });
const debugObject = {};

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load("./aerodynamics_workshop.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = environmentMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = environmentMap;
});

/**
 * Sliced model
 */
const geometry = new THREE.IcosahedronGeometry(2.5, 5);

const REVEAL_DURATION = 1.8;
const FINAL_ARC = 1.25;
const FINAL_SLICE_START = 1.75;

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const uniforms = {
  uSliceStart: new THREE.Uniform(FINAL_SLICE_START),
  uSliceArc: new THREE.Uniform(0),
};

const patchMap = {
  csm_Slice: {
    "#include <colorspace_fragment>": `
      #include <colorspace_fragment>
      if(!gl_FrontFacing) {
        gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
      }
    `,
  },
};

const material = new THREE.MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
});

const slicedMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  silent: true,
  patchMap: patchMap,
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
  side: THREE.DoubleSide,
});

const slicedDepthMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  silent: true,
  patchMap: patchMap,
  depthPacking: THREE.RGBADepthPacking,
});

// Model
let model = null;

gltfLoader.load("./gears.glb", (gltf) => {
  model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "outerHull") {
        child.material = slicedMaterial;
        child.customDepthMaterial = slicedDepthMaterial;
        child.castShadow = true;
      } else {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
  });

  scene.add(model);
});

/**
 * Plane
 */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 10),
  new THREE.MeshStandardMaterial({ color: "#aaaaaa" })
);
plane.receiveShadow = true;
plane.position.x = -4;
plane.position.y = -3;
plane.position.z = -4;
plane.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(plane);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 4);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.set(-5, 5, 12);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Reveal
  const revealProgress = Math.min(elapsedTime / REVEAL_DURATION, 1.0);
  uniforms.uSliceArc.value = easeOutBack(revealProgress) * FINAL_ARC;

  // Slow overall spin
  if (model) model.rotation.y = elapsedTime * 0.1;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();

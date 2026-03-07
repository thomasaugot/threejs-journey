import * as THREE from "three";
import GUI from "lil-gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";

/**
 * Debug
 */
const gui = new GUI();

const parameters = {
  materialColor: "#ffeded",
materialColorParticle: "#e248bb",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
});

gui.addColor(parameters, "materialColorParticle").onChange(() => {
  particlesMaterial.color.set(parameters.materialColorParticle);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#000000', 0.04);

// Objects

const textureLoader = new THREE.TextureLoader();

// Material
const material = new THREE.MeshStandardMaterial({
  color: parameters.materialColor,
  metalness: 0.9,
  roughness: 0.1,
});

// Meshes
const objectsDistance = 2;

const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);

const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);

const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material,
);

mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;

mesh1.position.z = 0;
mesh2.position.z = -1.5;
mesh3.position.z = 1;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

// Particles
const particlesCount = 2000;
const positions = new Float32Array(particlesCount * 3);
const originalPositions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  const x = (Math.random() - 0.5) * 10;
  const y = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length;
  const z = (Math.random() - 0.5) * 20;

  positions[i * 3 + 0] = originalPositions[i * 3 + 0] = x;
  positions[i * 3 + 1] = originalPositions[i * 3 + 1] = y;
  positions[i * 3 + 2] = originalPositions[i * 3 + 2] = z;
}

const colors = new Float32Array(particlesCount * 3);
const color = new THREE.Color();

for (let i = 0; i < particlesCount; i++) {
  color.setHSL(i / particlesCount, 1.0, 0.6);
  colors[i * 3 + 0] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3),
);
particlesGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(colors, 3),
);

const particleTexture = textureLoader.load("/textures/particles/2.png");

const particlesMaterial = new THREE.PointsMaterial({
  sizeAttenuation: true,
  size: 0.3,
  map: particleTexture,
  transparent: true,
  alphaMap: particleTexture,
  depthWrite: false,
  vertexColors: true,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Lights
const directionalLight = new THREE.DirectionalLight("#ffffff", 1.5);
directionalLight.position.set(1, 1, 0);

const directionalLight2 = new THREE.DirectionalLight("#8888ff", 0.8);
directionalLight2.position.set(-2, -1, 1);

const pointLight1 = new THREE.PointLight("#ff0080", 3, 10);
const pointLight2 = new THREE.PointLight("#00ffff", 3, 10);
const pointLight3 = new THREE.PointLight("#ffff00", 3, 10);

scene.add(directionalLight, directionalLight2, pointLight1, pointLight2, pointLight3);

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

// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // transparent background
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  0.6,  // strength
  0.4,  // radius
  0.5   // threshold
);
composer.addPass(bloomPass);

// Scroll
let scrollY = window.scrollY;
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

// Cursor
const cursor = {
  x: 0,
  y: 0,
};

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
    const newSection = Math.round(scrollY / sizes.height);
    if (newSection !== currentSection) {
        currentSection = newSection;
        gsap.to(sectionMeshes[currentSection].rotation, {
            duration: 1.5,
            ease: "power2.inOut",
            x: "+=6", // add 6 to the current rotation value
            y: "+=3", // add 3 to the current rotation value
        });
    }
});

/**
 * Animate
 */
const clock = new THREE.Clock();

let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // animate camera
  camera.position.y = - scrollY / sizes.height * objectsDistance;

  const parrallaxX = cursor.x * 0.5;
  const parrallaxY = - cursor.y * 0.5; // invert y axis by adding a minus sign so that the camera moves in the same direction as the cursor
  cameraGroup.position.x += (parrallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y += (parrallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // animate meshes
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // animate particles
  const positionAttribute = particlesGeometry.getAttribute("position");
  for (let i = 0; i < particlesCount; i++) {
    const ox = originalPositions[i * 3 + 0];
    const oy = originalPositions[i * 3 + 1];
    const oz = originalPositions[i * 3 + 2];
    positionAttribute.setX(i, ox + Math.sin(elapsedTime + i * 0.5) * 0.1);
    positionAttribute.setY(i, oy + Math.cos(elapsedTime * 0.7 + i * 0.3) * 0.1);
    positionAttribute.setZ(i, oz + Math.sin(elapsedTime * 0.5 + i * 0.7) * 0.15);
  }
  positionAttribute.needsUpdate = true;

  // Render
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

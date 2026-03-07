import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import CANNON from "cannon";

/**
 * Debug
 */
const gui = new dat.GUI();

const debugObject = {};

// create spheres buttons
debugObject.createSphere = () => {
  createSphere(Math.random() * 0.5, {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};
gui.add(debugObject, "createSphere").name("Create Sphere");

// create boxes buttons
debugObject.createBox = () => {
  createBox(
    Math.random() * 0.5,
    Math.random() * 0.5,
    Math.random() * 0.5,
    {
      x: (Math.random() - 0.5) * 3,
      y: 3,
      z: (Math.random() - 0.5) * 3,
    }
  );
};
gui.add(debugObject, "createBox").name("Create Box");

// reset — remove all objects from scene and physics world
debugObject.reset = () => {
  for (const object of objectsToUpdate) {
    object.body.removeEventListener("collide", playHitSound);
    world.removeBody(object.body);
    scene.remove(object.mesh);
  }
  objectsToUpdate.splice(0, objectsToUpdate.length);
};
gui.add(debugObject, "reset").name("Reset");

// explosion — blast all objects outward from center
debugObject.explode = () => {
  for (const object of objectsToUpdate) {
    const dir = new CANNON.Vec3(
      object.body.position.x,
      object.body.position.y + 1,
      object.body.position.z
    );
    dir.normalize();
    object.body.wakeUp();
    object.body.applyImpulse(
      new CANNON.Vec3(dir.x * 15, dir.y * 15 + 5, dir.z * 15),
      object.body.position
    );
  }
};
gui.add(debugObject, "explode").name("Explode!");

// tower — stack a 3x5 grid of boxes
debugObject.buildTower = () => {
  const size = 0.4;
  const gap = 0.05;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      createBox(size, size, size, {
        x: (col - 1) * (size + gap),
        y: size * 0.5 + row * (size + gap),
        z: 0,
      });
    }
  }
};
gui.add(debugObject, "buildTower").name("Build Tower");

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sound
const hitSound = new Audio("/sounds/hit.mp3");

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal(); // we get the impact strength of the collision, which is the velocity of the contact along the normal of the contact
  if (impactStrength > 1.5) {
    hitSound.volume = Math.random(); // we set a random volume for the hit sound, so that it is not always the same
    hitSound.currentTime = 0; // we reset the current time of the hit sound, so that it can be played again immediately after being played
    hitSound.play(); // we play the hit sound
  }
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.png",
  "/textures/environmentMaps/0/nx.png",
  "/textures/environmentMaps/0/py.png",
  "/textures/environmentMaps/0/ny.png",
  "/textures/environmentMaps/0/pz.png",
  "/textures/environmentMaps/0/nz.png",
]);

/**
 * Physics
 */

// World
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world); // this is an optimization for the physics engine, it allows to reduce the number of collision checks between bodies, it is especially useful when there are many bodies in the world
world.allowSleep = true; // this allows the physics engine to put bodies to sleep when they are not moving, which can improve performance
world.gravity.set(0, -9.82, 0); // the gravity of the world, in this case we set it to the gravity of the earth, but we can set it to whatever we want

// materials
const defaultMaterial = new CANNON.Material("concrete");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1, // the friction of the contact between the two materials, the higher the value, the more friction there is
    restitution: 0.7, // the restitution of the contact between the two materials, the higher the value, the more bouncy it is
  },
);
world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial; // we set the default contact material of the world to the one we just created, so that it is used for all contacts between bodies that do not have a specific contact material defined

// // Sphere
// const sphereShape = new CANNON.Sphere(0.5);
// const sphereBody = new CANNON.Body({
//   mass: 1, // represents the weight of the sphere, if mass is 0 it will be static
//   position: new CANNON.Vec3(0, 3, 0), // this is the initial position
//   shape: sphereShape, // this is the shape of the body, it can be a box, a plane, a cylinder, etc.
//   material: defaultMaterial, // this is the material of the body, it can be concrete, plastic, etc.
// });
// sphereBody.applyLocalForce(
//   new CANNON.Vec3(150, 0, 0),
//   new CANNON.Vec3(0, 0, 0),
// ); // we apply a force to the sphere body, the first parameter is the force vector, and the second parameter is the point of application of the force (in this case we apply it at the center of the body)
// world.addBody(sphereBody);

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.material = defaultMaterial; // we set the material of the floor to concrete, so that it has the properties of concrete when it interacts with other bodies
floorBody.mass = 0; // the floor should not move, so we set the mass to 0
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5); // we rotate the floor so that it is horizontal
world.addBody(floorBody);

// /**
//  * Test sphere
//  */
// const sphere = new THREE.Mesh(
//   new THREE.SphereGeometry(0.5, 32, 32),
//   new THREE.MeshStandardMaterial({
//     metalness: 0.3,
//     roughness: 0.4,
//     envMap: environmentMapTexture,
//     envMapIntensity: 0.5,
//   }),
// );
// sphere.castShadow = true;
// sphere.position.y = 0.5;
// scene.add(sphere);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#777777",
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5,
  }),
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
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
camera.position.set(-3, 3, 3);
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Galaxy background — painted on canvas, wrapped inside a sphere skybox
 */
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 2048;
skyCanvas.height = 1024;
const skyCtx = skyCanvas.getContext("2d");

// Deep space base
skyCtx.fillStyle = "#000008";
skyCtx.fillRect(0, 0, 2048, 1024);

// Random scattered stars across the whole sky
for (let i = 0; i < 14000; i++) {
  const x = Math.random() * 2048;
  const y = Math.random() * 1024;
  const r = Math.random() * 1.2 + 0.1;
  const b = Math.floor(160 + Math.random() * 95);
  const blueShift = Math.random() > 0.7 ? 35 : 0;
  const redShift = Math.random() > 0.85 ? 25 : 0;
  skyCtx.globalAlpha = 0.2 + Math.random() * 0.8;
  skyCtx.fillStyle = `rgb(${b + redShift},${b},${b + blueShift})`;
  skyCtx.beginPath();
  skyCtx.arc(x, y, r, 0, Math.PI * 2);
  skyCtx.fill();
}
skyCtx.globalAlpha = 1;

// Milky Way band — a soft glowing strip across the middle
const bandGrad = skyCtx.createLinearGradient(0, 280, 0, 744);
bandGrad.addColorStop(0, "rgba(0,0,0,0)");
bandGrad.addColorStop(0.2, "rgba(50,30,90,0.18)");
bandGrad.addColorStop(0.5, "rgba(110,80,170,0.38)");
bandGrad.addColorStop(0.8, "rgba(50,30,90,0.18)");
bandGrad.addColorStop(1, "rgba(0,0,0,0)");
skyCtx.fillStyle = bandGrad;
skyCtx.fillRect(0, 0, 2048, 1024);

// Dense stars concentrated inside the band
for (let i = 0; i < 8000; i++) {
  const x = Math.random() * 2048;
  const y = 512 + (Math.random() - 0.5) * 380;
  skyCtx.globalAlpha = Math.random() * 0.5 + 0.05;
  skyCtx.fillStyle = "white";
  skyCtx.beginPath();
  skyCtx.arc(x, y, Math.random() * 0.8, 0, Math.PI * 2);
  skyCtx.fill();
}
skyCtx.globalAlpha = 1;

// Bright galaxy core — warm orange/yellow glow
const coreGrad = skyCtx.createRadialGradient(1024, 512, 0, 1024, 512, 200);
coreGrad.addColorStop(0, "rgba(255,235,160,0.85)");
coreGrad.addColorStop(0.25, "rgba(230,165,70,0.5)");
coreGrad.addColorStop(0.6, "rgba(120,70,200,0.2)");
coreGrad.addColorStop(1, "rgba(0,0,0,0)");
skyCtx.fillStyle = coreGrad;
skyCtx.fillRect(700, 312, 648, 400);

// Bright core stars clustered around center
for (let i = 0; i < 1500; i++) {
  const angle = Math.random() * Math.PI * 2;
  const d = Math.pow(Math.random(), 2) * 160;
  const x = 1024 + Math.cos(angle) * d * 2.8;
  const y = 512 + Math.sin(angle) * d * 0.22;
  if (x < 0 || x > 2048 || y < 0 || y > 1024) continue;
  skyCtx.globalAlpha = 0.15 + Math.random() * 0.75;
  const b = Math.floor(210 + Math.random() * 45);
  skyCtx.fillStyle = `rgb(${b},${Math.floor(b * 0.88)},${Math.floor(b * 0.65)})`;
  skyCtx.beginPath();
  skyCtx.arc(x, y, Math.random() * 1.2 + 0.2, 0, Math.PI * 2);
  skyCtx.fill();
}

// A couple of coloured nebula patches for visual interest
const nebula = (cx, cy, rx, ry, r, g, b) => {
  const ng = skyCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  ng.addColorStop(0, `rgba(${r},${g},${b},0.12)`);
  ng.addColorStop(1, "rgba(0,0,0,0)");
  skyCtx.fillStyle = ng;
  skyCtx.save();
  skyCtx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
  skyCtx.beginPath();
  skyCtx.arc((cx * Math.max(rx, ry)) / rx, (cy * Math.max(rx, ry)) / ry, Math.max(rx, ry), 0, Math.PI * 2);
  skyCtx.fill();
  skyCtx.restore();
};
skyCtx.globalAlpha = 1;
nebula(400, 480, 220, 80, 80, 120, 255);   // blue nebula left
nebula(1600, 530, 200, 70, 255, 100, 60);  // orange nebula right
nebula(900, 560, 140, 50, 140, 60, 220);   // purple patch

const skyTexture = new THREE.CanvasTexture(skyCanvas);

const skySphere = new THREE.Mesh(
  new THREE.SphereGeometry(500, 32, 32),
  new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })
);
scene.add(skySphere);

/**
 * Click to spawn
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const spawnPoint = new THREE.Vector3();

window.addEventListener("click", (event) => {
  if (event.target !== canvas) return; // ignore clicks on the GUI
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  if (raycaster.ray.intersectPlane(floorPlane, spawnPoint)) {
    if (Math.random() > 0.5) {
      createSphere(Math.random() * 0.3 + 0.1, { x: spawnPoint.x, y: 3, z: spawnPoint.z });
    } else {
      createBox(
        Math.random() * 0.4 + 0.1,
        Math.random() * 0.4 + 0.1,
        Math.random() * 0.4 + 0.1,
        { x: spawnPoint.x, y: 3, z: spawnPoint.z }
      );
    }
  }
});

/**
 * Utils
 */

const objectsToUpdate = []; // we create an array to store the objects that we want to update in the animation loop, this way we can easily update all the objects without having to update them one by one

const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const neonColors = [
  "#ff00ff", // magenta
  "#00ffff", // cyan
  "#ff3300", // neon red
  "#00ff66", // neon green
  "#ff9900", // neon orange
  "#cc00ff", // neon purple
  "#00ccff", // electric blue
  "#ffff00", // neon yellow
];

const neonMaterials = neonColors.map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.1,
      envMap: environmentMapTexture,
      envMapIntensity: 1.5,
    })
);

const randomNeonMaterial = () => neonMaterials[Math.floor(Math.random() * neonMaterials.length)];

const createSphere = (radius, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(sphereGeometry, randomNeonMaterial());
  mesh.scale.set(radius, radius, radius);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound); // we add an event listener to the body, so that we can play a sound when it collides with another body
  world.addBody(body);

  objectsToUpdate.push({ mesh, body });
};

const createBox = (width, height, depth, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(boxGeometry, randomNeonMaterial());
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5));
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound); // we add an event listener to the body, so that we can play a sound when it collides with another body
  world.addBody(body);

  objectsToUpdate.push({ mesh, body });
};

createSphere(0.5, { x: 0, y: 3, z: 0 });

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // slowly rotate the galaxy
  skySphere.rotation.y = elapsedTime * 0.015;

  // update physics world
  //   sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphereBody.position); // we apply a force to the sphere body, the first parameter is the force vector, and the second parameter is the point of application of the force (in this case we apply it at the center of the body)

  world.step(1 / 60, deltaTime, 3); // the first parameter is the time step, the second parameter is the time since the last call to step, and the third parameter is the number of iterations to perform

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion); // we copy the rotation of the body to the mesh, so that the mesh follows the physics body
  }
  //   sphere.position.copy(sphereBody.position); // we copy the position of the sphere body to the sphere mesh, so that the mesh follows the physics body

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

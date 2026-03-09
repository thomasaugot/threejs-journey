import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mod } from "three/tsl";

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
 * Objects
 */
const object1 = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 16, 16),
  new THREE.MeshBasicMaterial({ color: "#ff0000" }),
);
object1.position.x = -2;

const object2 = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 16, 16),
  new THREE.MeshBasicMaterial({ color: "#ff0000" }),
);

const object3 = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 16, 16),
  new THREE.MeshBasicMaterial({ color: "#ff0000" }),
);
object3.position.x = 2;

scene.add(object1, object2, object3);

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

const rayOrigin = new THREE.Vector3(-3, 0, 0); // The ray will start from the left of the objects, and will point towards the right, where the objects are
const rayDirection = new THREE.Vector3(1, 0, 0); // The ray is pointing from left to right, towards the objects
rayDirection.normalize(); // The direction should be normalized, otherwise the raycaster will not work correctly

raycaster.set(rayOrigin, rayDirection);

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
 * Mouse
 */
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1; // We need to convert the mouse coordinates from screen space (0 to 1) to normalized device coordinates (-1 to 1)
  mouse.y = -((event.clientY / sizes.height) * 2 - 1); // We need to invert the y coordinate, because in screen space, y is positive downwards, but in normalized device coordinates, y is positive upwards
});

window.addEventListener("click", () => {
  if (currentIntersect) {
    console.log("click on object"); // We can also use the currentIntersect variable to know if we are currently intersecting an object or not, and if we are, which object we are intersecting
    if (currentIntersect.object === object1) {
      console.log("click on object 1");
    } else if (currentIntersect.object === object2) {
      console.log("click on object 2");
    } else if (currentIntersect.object === object3) {
      console.log("click on object 3");
    }
  }
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
camera.position.z = 3;
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
 * Model
 */
const gltfLoader = new GLTFLoader();

let model = null;

gltfLoader.load("/models/Duck/glTF-Binary/Duck.glb", (gltf) => {
  model = gltf.scene;
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.rotation.y = Math.PI * 0.5;
  scene.add(model);
});

/**
 * Light
 */
const ambientLight = new THREE.AmbientLight("#fffff", 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
directionalLight.position.set(1, 2, 0);
scene.add(directionalLight);

/**
 * Animate
 */
const clock = new THREE.Clock();

let currentIntersect = null; // witness variable to know if we are currently intersecting an object or not, and if we are, which object we are intersecting

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // animate objects
  object1.position.y = Math.sin(elapsedTime * 0.3) * 1.5;
  object2.position.y = Math.sin(elapsedTime * 0.8) * 1.5;
  object3.position.y = Math.sin(elapsedTime * 1.4) * 1.5;

  // cast a ray every frame
  raycaster.setFromCamera(mouse, camera); // We can also set the raycaster from the camera and the mouse position, which is more convenient for mouse picking

  const objectsToTest = [object1, object2, object3];
  const intersects = raycaster.intersectObjects(objectsToTest);

  for (const object of objectsToTest) {
    object.material.color.set("#ff0000");
  }

  for (const intersect of intersects) {
    intersect.object.material.color.set("#5757c5");
  }

  if (intersects.length) {
    if (currentIntersect === null) {
      console.log("mouse enter");
    }

    currentIntersect = intersects[0];
  } else {
    if (currentIntersect) {
      console.log("mouse leave");
    }

    currentIntersect = null;
  }

  // const rayOrigin = new THREE.Vector3(- 3, 0, 0)
  // const rayDirection = new THREE.Vector3(1, 0, 0)
  // rayDirection.normalize()

  // raycaster.set(rayOrigin, rayDirection)

  // const objectsToTest = [object1, object2, object3] // We can also test against all the objects in the scene, but it is better to test only against the objects we want to test against, for performance reasons
  // const intersects = raycaster.intersectObjects(objectsToTest)

  // for (const object of objectsToTest)
  // {
  //     object.material.color.set('#ff0000')
  // }

  // for (const intersect of intersects)
  // {
  //     intersect.object.material.color.set('#5757c5')
  // }

  if (model) {
    const modelIntersects = raycaster.intersectObject(model); // We can also test against a specific object, for example the model we loaded, which is the 4th child of the scene
    // console.log(modelIntersects);

    if (modelIntersects.length) {
      model.scale.set(1.2, 1.2, 1.2);
    } else {
      model.scale.set(1, 1, 1);
    }
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

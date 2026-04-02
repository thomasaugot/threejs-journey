import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

const gui = new GUI();
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2("#040510", 0.006);

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
const planetTextures = [
  textureLoader.load("/textures/textures _1/worn_concrete_floor_diff_1k.jpg"),
  textureLoader.load("/textures/textures_2/rocks_ground_03_diff_1k.jpg"),
  textureLoader.load("/textures/textures_3/moon_01_diff_1k.jpg"),
  textureLoader.load("/textures/textures_4/clean_asphalt_diff_1k.jpg"),
];

for (const tex of planetTextures) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
}

// ---------------------------------------------------------------------------
// Glow sprite factory
// ---------------------------------------------------------------------------
const createGlowSprite = (stops) => {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  for (const s of stops) g.addColorStop(s.offset, s.color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Warm sun glow – white core bleeding into orange/red corona
const sunSprite = createGlowSprite([
  { offset: 0,    color: "rgba(255,255,255,1)"   },
  { offset: 0.10, color: "rgba(255,245,190,0.98)" },
  { offset: 0.28, color: "rgba(255,160,55,0.62)"  },
  { offset: 0.60, color: "rgba(220,80,20,0.18)"   },
  { offset: 1,    color: "rgba(180,40,0,0)"        },
]);

// Background star sprite – warm point glows
const starSprite = createGlowSprite([
  { offset: 0,    color: "rgba(255,255,255,1)"    },
  { offset: 0.14, color: "rgba(255,220,170,0.90)" },
  { offset: 0.38, color: "rgba(255,130,60,0.30)"  },
  { offset: 1,    color: "rgba(180,50,0,0)"        },
]);

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------
const parameters = {
  systemCount:      2500,   // 8000 was killing the GPU
  spiralStarCount:  28000,
  dustCount:        30000,
  haloCount:        4000,
  radius:           72,
  branches:         4,
  spin:             1.4,    // less wound – arms read as arms not rings
  randomness:       0.22,   // wider scatter off arm centreline
  randomnessPower:  2.1,    // more uniform distribution
  starCoreSize:     0.028,   // all stars are essentially point-like at galaxy scale
  sunGlowSize:      0.55,
  spiralStarSize:   0.26,
  dustSize:         0.32,
  minPlanetsPerStar: 1,
  maxPlanetsPerStar: 4,     // 7 was ~56k instances; 4 keeps it ~10k
  minPlanetScale:   0.006,
  maxPlanetScale:   0.028,
  insideColor:      "#ffd090",
  midColor:         "#9f7bff",
  outsideColor:     "#6db7ff",
};

// ---------------------------------------------------------------------------
// Shared geometry & materials
// ---------------------------------------------------------------------------
const planetGeometry = new THREE.SphereGeometry(1, 22, 22);
const starGeometry   = new THREE.SphereGeometry(1, 14, 14);
const dummy = new THREE.Object3D();

// Stars are emissive – they don't receive scene lighting
const starMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" });

const planetMaterials = planetTextures.map((tex) =>
  new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.0 })
);

// ---------------------------------------------------------------------------
// Dynamic light pool  (point lights that follow the camera to nearby stars)
// ---------------------------------------------------------------------------
const POOL_SIZE = 8;
const lightPool = [];
for (let i = 0; i < POOL_SIZE; i++) {
  const l = new THREE.PointLight(0xffffff, 0, 0, 2);
  scene.add(l);
  lightPool.push(l);
}

// Permanent galactic-core point light
const coreLight = new THREE.PointLight(0xffeecc, 4.5, 58, 1.4);
scene.add(coreLight);

// ---------------------------------------------------------------------------
// State refs
// ---------------------------------------------------------------------------
let galaxyRoot = null, spiralStars = null, dustCloud = null;
let galaxyHalo = null, starCores = null, starGlows = null;
let planetGroup = null, galacticCore = null, coreGlow = null;

let starGlowGeometry = null, starGlowMaterial = null;
let spiralStarsGeometry = null, spiralStarsMaterial = null;
let dustGeometry = null, dustMaterial = null;
let haloGeometry = null, haloMaterial = null;

let systems = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const randomSign = () => (Math.random() < 0.5 ? -1 : 1);

const spiralPoint = (index, radiusMultiplier = 1) => {
  const radius = Math.pow(Math.random(), 1.35) * parameters.radius * radiusMultiplier;
  const ratio  = radius / (parameters.radius * radiusMultiplier);

  // Inner ~12 % of the disc is the galactic bulge – no arm structure, fully random angle
  // so all 4 arms don't visibly converge into a perfect bullseye at the centre
  let angle;
  if (ratio < 0.18) {
    angle = Math.random() * Math.PI * 2;
  } else {
    const branch     = ((index % parameters.branches) / parameters.branches) * Math.PI * 2;
    const angleNoise = THREE.MathUtils.randFloatSpread(Math.PI * 0.28 * ratio);
    angle = ratio * parameters.spin * 7.5 + branch + angleNoise;
  }

  const tight  = THREE.MathUtils.lerp(0.42, 1.0, ratio);
  const pow    = parameters.randomnessPower;
  const rnd    = parameters.randomness;
  const rX = Math.pow(Math.random(), pow)       * randomSign() * rnd * radius * tight;
  const rY = Math.pow(Math.random(), pow + 0.5) * randomSign() * rnd * radius * 0.04;
  const rZ = Math.pow(Math.random(), pow)       * randomSign() * rnd * radius * tight;
  return {
    radius,
    x: Math.cos(angle) * radius + rX,
    y: rY,
    z: Math.sin(angle) * radius + rZ,
  };
};

const spiralColor = (radius) => {
  const c0 = new THREE.Color(parameters.insideColor);
  const c1 = new THREE.Color(parameters.midColor);
  const c2 = new THREE.Color(parameters.outsideColor);
  const t  = radius / parameters.radius;
  return t < 0.45 ? c0.lerp(c1, t / 0.45) : c1.lerp(c2, (t - 0.45) / 0.55);
};

// Realistic stellar colour distribution: red dwarf → orange → yellow → yellow-white → white
const realisticStarColor = () => {
  const r = Math.random();
  if (r < 0.62) {
    // M-type: red dwarf (most common ~62 %)
    return new THREE.Color().setHSL(
      THREE.MathUtils.randFloat(0.0,   0.034),
      THREE.MathUtils.randFloat(0.78,  1.0),
      THREE.MathUtils.randFloat(0.38,  0.58),
    );
  }
  if (r < 0.77) {
    // K-type: orange (~15 %)
    return new THREE.Color().setHSL(
      THREE.MathUtils.randFloat(0.036, 0.086),
      THREE.MathUtils.randFloat(0.72,  0.92),
      THREE.MathUtils.randFloat(0.54,  0.70),
    );
  }
  if (r < 0.87) {
    // G-type: yellow – like our Sun (~10 %)
    return new THREE.Color().setHSL(
      THREE.MathUtils.randFloat(0.09,  0.14),
      THREE.MathUtils.randFloat(0.68,  0.90),
      THREE.MathUtils.randFloat(0.66,  0.80),
    );
  }
  if (r < 0.94) {
    // F-type: yellow-white (~7 %)
    return new THREE.Color().setHSL(
      THREE.MathUtils.randFloat(0.10,  0.17),
      THREE.MathUtils.randFloat(0.26,  0.50),
      THREE.MathUtils.randFloat(0.80,  0.90),
    );
  }
  // A-type and beyond: white (~6 %)
  return new THREE.Color().setHSL(
    THREE.MathUtils.randFloat(0.08, 0.16),
    THREE.MathUtils.randFloat(0.04, 0.18),
    THREE.MathUtils.randFloat(0.90, 0.98),
  );
};

// ---------------------------------------------------------------------------
// Dispose
// ---------------------------------------------------------------------------
const disposeGalaxy = () => {
  if (galaxyRoot) { scene.remove(galaxyRoot); galaxyRoot = null; }
  for (const r of [
    starGlowGeometry, starGlowMaterial,
    spiralStarsGeometry, spiralStarsMaterial,
    dustGeometry, dustMaterial,
    haloGeometry, haloMaterial,
  ]) r?.dispose?.();
  // Dispose all core children (bulge point cloud + sprites)
  if (galacticCore) {
    galacticCore.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }
  coreGlow = null;
  starGlowGeometry = starGlowMaterial = null;
  spiralStarsGeometry = spiralStarsMaterial = null;
  dustGeometry = dustMaterial = null;
  haloGeometry = haloMaterial = null;
  galacticCore = null;
  systems = [];
};

// ---------------------------------------------------------------------------
// Spiral star / dust layer
// ---------------------------------------------------------------------------
// Fraction of points placed randomly in the disc rather than on an arm.
// Breaks the geometric ring-like appearance of tight spiral arms.
const FIELD_STAR_FRACTION = 0.28;

const randomDiscPoint = () => {
  // Bias toward centre (denser core), uniform in angle
  const radius = Math.pow(Math.random(), 0.7) * parameters.radius;
  const angle  = Math.random() * Math.PI * 2;
  return {
    radius,
    x: Math.cos(angle) * radius,
    y: THREE.MathUtils.randFloatSpread(0.08 * radius + 0.1),
    z: Math.sin(angle) * radius,
  };
};

const createSpiralLayer = (count, size, opacity, jitterY) => {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3      = i * 3;
    const isField = Math.random() < FIELD_STAR_FRACTION;
    const p       = isField ? randomDiscPoint() : spiralPoint(i);
    const c       = spiralColor(p.radius);
    // Field stars are dimmer so arm stars still stand out
    const dimming = isField ? 0.45 : 1.0;
    const br      = THREE.MathUtils.lerp(1.2, 4.5, 1 - p.radius / parameters.radius) * dimming;
    pos[i3]   = p.x; pos[i3+1] = p.y * jitterY; pos[i3+2] = p.z;
    col[i3]   = c.r * br; col[i3+1] = c.g * br; col[i3+2] = c.b * br;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, sizeAttenuation: true, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending,
    vertexColors: true, map: starSprite,
  });
  return { geometry: geo, material: mat, points: new THREE.Points(geo, mat) };
};

// ---------------------------------------------------------------------------
// Galactic core – organic stellar bulge (point cloud) + tiny nucleus sprite
// No large circular sprites: those are what made the centre look "drawn"
// ---------------------------------------------------------------------------
const createGalacticCore = () => {
  galacticCore = new THREE.Group();
  const R = parameters.radius;
  const BULGE_N = 6000;
  const bulgeRadius = R * 0.20;

  // Dense exponential star cloud – the actual galactic bulge population
  const bulgeGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(BULGE_N * 3);
  const bCol = new Float32Array(BULGE_N * 3);

  for (let i = 0; i < BULGE_N; i++) {
    const i3 = i * 3;
    // Exponential density: very concentrated at centre
    const r     = Math.pow(Math.random(), 3.0) * bulgeRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(THREE.MathUtils.randFloatSpread(2));
    // Flatten to disc; slight thickness variation so it's not a perfect disc
    const flat  = THREE.MathUtils.lerp(0.06, 0.28, r / bulgeRadius) * (0.8 + Math.random() * 0.4);

    bPos[i3]   = Math.sin(phi) * Math.cos(theta) * r;
    bPos[i3+1] = Math.cos(phi) * r * flat;
    bPos[i3+2] = Math.sin(phi) * Math.sin(theta) * r;

    // Warm yellow-orange colours, brightest at centre
    const c  = new THREE.Color().setHSL(
      THREE.MathUtils.randFloat(0.07, 0.14),
      THREE.MathUtils.randFloat(0.5, 0.9),
      THREE.MathUtils.randFloat(0.72, 1.0),
    );
    const br = THREE.MathUtils.lerp(4.0, 0.8, r / bulgeRadius);
    bCol[i3]   = c.r * br; bCol[i3+1] = c.g * br; bCol[i3+2] = c.b * br;
  }

  bulgeGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  bulgeGeo.setAttribute("color",    new THREE.BufferAttribute(bCol, 3));

  const bulgeMat = new THREE.PointsMaterial({
    size: 0.20, sizeAttenuation: true, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, map: sunSprite,
  });
  galacticCore.add(new THREE.Points(bulgeGeo, bulgeMat));

  // Subtle diffuse inner glow – much smaller than before
  const midMat = new THREE.SpriteMaterial({
    map: sunSprite, color: new THREE.Color("#fff3cc"),
    transparent: true, opacity: 0.70, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  coreGlow = new THREE.Sprite(midMat);
  coreGlow.scale.set(R * 0.065, R * 0.065, 1);  // was 0.14 and 0.58 – those were the circles
  galacticCore.add(coreGlow);

  // White-hot nucleus pinpoint
  const nucleusMat = new THREE.SpriteMaterial({
    map: sunSprite, color: new THREE.Color("#ffffff"),
    transparent: true, opacity: 1.0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const nucleus = new THREE.Sprite(nucleusMat);
  nucleus.scale.set(R * 0.018, R * 0.018, 1);
  galacticCore.add(nucleus);
};

// ---------------------------------------------------------------------------
// Spherical halo
// ---------------------------------------------------------------------------
const createHalo = () => {
  haloGeometry = new THREE.BufferGeometry();
  const pos = new Float32Array(parameters.haloCount * 3);
  const col = new Float32Array(parameters.haloCount * 3);
  for (let i = 0; i < parameters.haloCount; i++) {
    const i3  = i * 3;
    const r   = THREE.MathUtils.randFloat(parameters.radius * 0.65, parameters.radius * 1.6);
    const th  = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const sq  = THREE.MathUtils.randFloat(0.12, 0.40);
    const c   = new THREE.Color().lerpColors(
      new THREE.Color(parameters.midColor),
      new THREE.Color(parameters.outsideColor),
      Math.random(),
    );
    pos[i3]   = Math.sin(phi) * Math.cos(th) * r;
    pos[i3+1] = Math.cos(phi) * r * sq;
    pos[i3+2] = Math.sin(phi) * Math.sin(th) * r;
    col[i3]   = c.r * 0.5; col[i3+1] = c.g * 0.5; col[i3+2] = c.b * 0.65;
  }
  haloGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  haloGeometry.setAttribute("color",    new THREE.BufferAttribute(col, 3));
  haloMaterial = new THREE.PointsMaterial({
    size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.26,
    depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, map: starSprite,
  });
  galaxyHalo = new THREE.Points(haloGeometry, haloMaterial);
};

// ---------------------------------------------------------------------------
// Solar system data
// ---------------------------------------------------------------------------
const createSystems = () => {
  systems = [];
  for (let i = 0; i < parameters.systemCount; i++) {
    const p        = spiralPoint(i, 0.95);
    const position = new THREE.Vector3(p.x, p.y, p.z);
    const starColor = realisticStarColor();

    // Size scales with stellar type (luminosity proxy)
    const hsl = {};
    starColor.getHSL(hsl);
    // All stars are point-like at galaxy scale – keep size differences subtle
    let sizeMult;
    if      (hsl.l < 0.52) sizeMult = THREE.MathUtils.randFloat(0.30, 0.65);  // red dwarfs: faint
    else if (hsl.l < 0.68) sizeMult = THREE.MathUtils.randFloat(0.60, 0.95);  // orange/yellow
    else if (hsl.l < 0.84) sizeMult = THREE.MathUtils.randFloat(0.85, 1.20);  // yellow-white
    else                   sizeMult = THREE.MathUtils.randFloat(1.05, 1.40);  // white: slightly larger

    const starScale  = parameters.starCoreSize * sizeMult;
    const glowColor  = spiralColor(p.radius).lerp(starColor.clone(), 0.40);
    const orbitTilt  = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.randFloatSpread(0.9),
      Math.random() * Math.PI * 2,
      THREE.MathUtils.randFloatSpread(0.9),
    ));

    const planetCount = THREE.MathUtils.randInt(parameters.minPlanetsPerStar, parameters.maxPlanetsPerStar);
    const planets = [];
    let orbitR = starScale * THREE.MathUtils.randFloat(7, 12);

    for (let pi = 0; pi < planetCount; pi++) {
      const scale = THREE.MathUtils.lerp(
        parameters.minPlanetScale, parameters.maxPlanetScale,
        Math.pow(Math.random(), 1.6),
      );
      orbitR += scale * THREE.MathUtils.randFloat(26, 44) + 0.05;

      // Inner planets warm, outer cool
      const warmth = 1 - pi / Math.max(planetCount - 1, 1);
      const tint = new THREE.Color().setHSL(
        THREE.MathUtils.lerp(0.55, 0.08, warmth) + THREE.MathUtils.randFloatSpread(0.06),
        THREE.MathUtils.randFloat(0.04, 0.28),
        THREE.MathUtils.randFloat(0.68, 0.94),
      );

      planets.push({
        angle:       Math.random() * Math.PI * 2,
        orbitRadius: orbitR,
        orbitSpeed:  THREE.MathUtils.randFloat(0.025, 0.07) / Math.pow(orbitR * 5, 0.78),
        scale,
        spinSpeed:   THREE.MathUtils.randFloat(0.04, 0.24) * randomSign(),
        textureIndex: Math.floor(Math.random() * planetTextures.length),
        tint,
        tilt: new THREE.Euler(
          THREE.MathUtils.randFloatSpread(0.65),
          Math.random() * Math.PI * 2,
          THREE.MathUtils.randFloatSpread(0.65),
        ),
      });
    }

    systems.push({ glowColor, orbitTilt, planets, position, starColor, starScale });
  }
};

// ---------------------------------------------------------------------------
// Instanced meshes for stars & planets
// ---------------------------------------------------------------------------
const _initOffset = new THREE.Vector3();

const createSystemMeshes = () => {
  starCores       = new THREE.InstancedMesh(starGeometry, starMaterial, systems.length);
  starGlowGeometry = new THREE.BufferGeometry();

  const glowPos = new Float32Array(systems.length * 3);
  const glowCol = new Float32Array(systems.length * 3);
  const byTex   = Array.from({ length: planetTextures.length }, () => []);

  systems.forEach((sys, si) => {
    dummy.position.copy(sys.position);
    dummy.scale.setScalar(sys.starScale);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    starCores.setMatrixAt(si, dummy.matrix);
    starCores.setColorAt(si, sys.starColor);

    const i3 = si * 3;
    glowPos[i3]   = sys.position.x; glowPos[i3+1] = sys.position.y; glowPos[i3+2] = sys.position.z;
    glowCol[i3]   = sys.glowColor.r; glowCol[i3+1] = sys.glowColor.g; glowCol[i3+2] = sys.glowColor.b;

    sys.planets.forEach((planet) => {
      byTex[planet.textureIndex].push({ localOffset: new THREE.Vector3(), planet, systemIndex: si });
    });
  });

  starCores.instanceMatrix.needsUpdate = true;
  starCores.instanceColor.needsUpdate  = true;

  starGlowGeometry.setAttribute("position", new THREE.BufferAttribute(glowPos, 3));
  starGlowGeometry.setAttribute("color",    new THREE.BufferAttribute(glowCol, 3));

  starGlowMaterial = new THREE.PointsMaterial({
    map: sunSprite, size: parameters.sunGlowSize, sizeAttenuation: true,
    transparent: true, opacity: 0.85, alphaTest: 0.01,
    depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
  });
  starGlows = new THREE.Points(starGlowGeometry, starGlowMaterial);

  planetGroup = new THREE.Group();

  byTex.forEach((instances, texIdx) => {
    const mesh = new THREE.InstancedMesh(
      planetGeometry, planetMaterials[texIdx], Math.max(instances.length, 1)
    );
    mesh.count = instances.length;
    mesh.userData.instances = instances;

    instances.forEach((inst, idx) => {
      const sys = systems[inst.systemIndex];
      // Place each planet at its starting orbital angle so it's never at origin
      _initOffset.set(
        Math.cos(inst.planet.angle) * inst.planet.orbitRadius,
        0,
        Math.sin(inst.planet.angle) * inst.planet.orbitRadius,
      );
      _initOffset.applyQuaternion(sys.orbitTilt);
      inst.localOffset.copy(_initOffset);

      dummy.position.copy(sys.position).add(_initOffset);
      dummy.rotation.copy(inst.planet.tilt);
      dummy.scale.setScalar(inst.planet.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      if (mesh.instanceColor) mesh.setColorAt(idx, inst.planet.tint);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    planetGroup.add(mesh);
  });
};

// ---------------------------------------------------------------------------
// Full galaxy assembly
// ---------------------------------------------------------------------------
const generateGalaxy = () => {
  disposeGalaxy();
  galaxyRoot = new THREE.Group();

  const sl = createSpiralLayer(parameters.spiralStarCount, parameters.spiralStarSize, 0.9,  1.15);
  spiralStarsGeometry = sl.geometry; spiralStarsMaterial = sl.material; spiralStars = sl.points;

  const dl = createSpiralLayer(parameters.dustCount, parameters.dustSize, 0.60, 1.85);
  dustGeometry = dl.geometry; dustMaterial = dl.material; dustCloud = dl.points;
  dustCloud.scale.set(1.04, 0.55, 1.04);

  createHalo();
  createGalacticCore();
  createSystems();
  createSystemMeshes();

  galaxyRoot.add(dustCloud);
  galaxyRoot.add(galaxyHalo);
  galaxyRoot.add(galacticCore);
  galaxyRoot.add(spiralStars);
  galaxyRoot.add(starGlows);
  galaxyRoot.add(starCores);
  galaxyRoot.add(planetGroup);

  // Tilt so the disc is visible from starting camera position
  galaxyRoot.rotation.x = -0.9;
  galaxyRoot.rotation.z =  0.18;

  scene.add(galaxyRoot);
};

generateGalaxy();

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
gui.add(parameters, "systemCount").min(100).max(12000).step(100).onFinishChange(generateGalaxy);
gui.add(parameters, "spiralStarCount").min(10000).max(100000).step(1000).onFinishChange(generateGalaxy);
gui.add(parameters, "dustCount").min(10000).max(120000).step(1000).onFinishChange(generateGalaxy);
gui.add(parameters, "radius").min(30).max(120).step(1).onFinishChange(generateGalaxy);
gui.add(parameters, "branches").min(2).max(6).step(1).onFinishChange(generateGalaxy);
gui.add(parameters, "spin").min(0.8).max(3.5).step(0.01).onFinishChange(generateGalaxy);
gui.add(parameters, "randomness").min(0.01).max(0.2).step(0.001).onFinishChange(generateGalaxy);
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "midColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

// ---------------------------------------------------------------------------
// Scene lights  (global; dynamic pool handles close-up star lighting)
// ---------------------------------------------------------------------------
const ambientLight = new THREE.AmbientLight("#16203a", 0.45);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight("#ffd09a", "#10152e", 0.40);
scene.add(hemisphereLight);

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.001, 520);
camera.position.set(0, -48, -75);
scene.add(camera);

// ---------------------------------------------------------------------------
// Controls – allow full zoom from galaxy-wide to single-planet scale
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping  = true;
controls.dampingFactor  = 0.05;
controls.minDistance    = 0.02;   // zoom into individual solar systems
controls.maxDistance    = 200;
controls.maxPolarAngle  = Math.PI; // free vertical rotation

// ---------------------------------------------------------------------------
// Renderer – logarithmic depth buffer handles the extreme zoom range
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  logarithmicDepthBuffer: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace  = THREE.SRGBColorSpace;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.4;
renderer.setClearColor("#060812");

window.addEventListener("resize", () => {
  sizes.width  = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ---------------------------------------------------------------------------
// Shared per-frame inverse galaxy matrix (computed once in tick, reused everywhere)
// ---------------------------------------------------------------------------
const _invGal   = new THREE.Matrix4();
const _galWorld = new THREE.Matrix4();

// ---------------------------------------------------------------------------
// Dynamic lighting – 8 point lights chase the camera to the nearest stars
// ---------------------------------------------------------------------------
const _camLocal  = new THREE.Vector3();
const _lightPos  = new THREE.Vector3();
const _nearBuf   = Array.from({ length: POOL_SIZE }, () => ({ dSq: Infinity, idx: -1 }));

const updateDynamicLights = () => {
  if (!systems.length || !galaxyRoot || _galWorld.elements[15] === 0) return;

  // Use precomputed inverse (no redundant matrix inversion per call)
  _camLocal.copy(camera.position).applyMatrix4(_invGal);

  // Partial-sort: track POOL_SIZE nearest systems without a full sort
  for (let k = 0; k < POOL_SIZE; k++) { _nearBuf[k].dSq = Infinity; _nearBuf[k].idx = -1; }
  let maxDSq = Infinity, maxBufIdx = 0;

  for (let i = 0; i < systems.length; i++) {
    const dSq = systems[i].position.distanceToSquared(_camLocal);
    if (dSq < maxDSq) {
      _nearBuf[maxBufIdx].dSq = dSq;
      _nearBuf[maxBufIdx].idx = i;
      maxDSq = 0; maxBufIdx = 0;
      for (let k = 0; k < POOL_SIZE; k++) {
        if (_nearBuf[k].dSq > maxDSq) { maxDSq = _nearBuf[k].dSq; maxBufIdx = k; }
      }
    }
  }

  // Assign / fade pool lights
  const ACTIVATE = 5.0;
  for (let k = 0; k < POOL_SIZE; k++) {
    const e  = _nearBuf[k];
    const pl = lightPool[k];
    if (e.idx === -1 || e.dSq > ACTIVATE * ACTIVATE) { pl.intensity = 0; continue; }

    const sys = systems[e.idx];
    _lightPos.copy(sys.position).applyMatrix4(_galWorld);
    pl.position.copy(_lightPos);
    pl.color.copy(sys.starColor);
    const t = 1 - Math.sqrt(e.dSq) / ACTIVATE;
    pl.intensity = t * t * 5.5;
    pl.distance  = sys.starScale * 650;
  }

  // Keep core light at galaxy-centre world position (extract translation column from matrixWorld)
  _lightPos.setFromMatrixPosition(_galWorld);
  coreLight.position.copy(_lightPos);
};

// ---------------------------------------------------------------------------
// Planet animation – culled to nearby systems for performance
// ---------------------------------------------------------------------------
const _pCamLocal   = new THREE.Vector3();
const ANIM_DIST_SQ = 14 * 14; // galaxy-local units²

const updatePlanets = (t) => {
  if (!planetGroup || !galaxyRoot || _galWorld.elements[15] === 0) return;

  _pCamLocal.copy(camera.position).applyMatrix4(_invGal);

  planetGroup.children.forEach((mesh) => {
    const instances = mesh.userData.instances;
    let dirty = false;

    instances.forEach((inst, idx) => {
      const sys = systems[inst.systemIndex];
      if (sys.position.distanceToSquared(_pCamLocal) > ANIM_DIST_SQ) return;

      const angle = inst.planet.angle + t * inst.planet.orbitSpeed;
      inst.localOffset.set(
        Math.cos(angle) * inst.planet.orbitRadius,
        0,
        Math.sin(angle) * inst.planet.orbitRadius,
      );
      inst.localOffset.applyQuaternion(sys.orbitTilt);

      dummy.position.copy(sys.position).add(inst.localOffset);
      dummy.rotation.set(
        inst.planet.tilt.x,
        inst.planet.tilt.y + t * inst.planet.spinSpeed,
        inst.planet.tilt.z,
      );
      dummy.scale.setScalar(inst.planet.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      dirty = true;
    });

    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  });
};

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------
const _t0 = performance.now();

const tick = () => {
  const t = (performance.now() - _t0) / 1000;

  controls.update();

  if (galaxyRoot) {
    // Primary disc spin
    galaxyRoot.rotation.y = t * 0.022;
    // Precompute inverse once so updateDynamicLights + updatePlanets share it
    galaxyRoot.updateWorldMatrix(true, false);
    _galWorld.copy(galaxyRoot.matrixWorld);
    _invGal.copy(_galWorld).invert();
  }
  if (spiralStars) {
    // Differential rotation: inner arms slightly faster than outer halo
    spiralStars.rotation.y = t * 0.013;
  }
  if (dustCloud) {
    // Counter-rotation of dust lanes (realistic)
    dustCloud.rotation.y = -t * 0.007;
  }
  if (galaxyHalo) {
    galaxyHalo.rotation.y = t * 0.005;
  }

  updateDynamicLights();
  updatePlanets(t);

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();

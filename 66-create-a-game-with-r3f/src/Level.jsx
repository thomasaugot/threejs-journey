import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import useGame, { DIFFICULTIES } from "./stores/useGame.js";
import "./PortalMaterial.jsx";

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Rick & Morty "dimension rift" palette: toxic portal-green + sickly purple.
const PORTAL_GREEN = "#97ce4c";
const RIFT_PURPLE = "#3a1f5d";

const floor1material = new THREE.MeshStandardMaterial({
  color: "#2a2140",
  metalness: 0.2,
  roughness: 0.7,
});
const floor2material = new THREE.MeshStandardMaterial({
  color: "#34284f",
  metalness: 0.2,
  roughness: 0.7,
});
const obstacleMaterial = new THREE.MeshStandardMaterial({
  color: "#6b8f3a",
  emissive: PORTAL_GREEN,
  emissiveIntensity: 0.15,
  metalness: 0.1,
  roughness: 0.7,
});
const wallMaterial = new THREE.MeshStandardMaterial({
  color: "#1a1030",
  metalness: 0.3,
  roughness: 0.7,
  transparent: true,
  opacity: 0.85,
});

// Obstacle speed ramps per level, scaled by the chosen difficulty preset.
function useSpeedMultiplier() {
  const level = useGame((state) => state.level);
  const difficulty = useGame((state) => state.difficulty);
  const { speedRamp, speedCap } = DIFFICULTIES[difficulty];
  return Math.min(1 + (level - 1) * speedRamp, speedCap);
}


export function BlockStart({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        geometry={boxGeometry}
        material={floor1material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
    </group>
  );
}

export function BlockSpinner({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [speed] = useState(
    () => (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1),
  );

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const rotation = new THREE.Quaternion();
    rotation.setFromEuler(new THREE.Euler(0, time * speed * speedMultiplier, 0));
    obstacle.current.setNextKinematicRotation(rotation);
  });

  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

export function BlockLimbo({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const y = Math.sin(time * speedMultiplier + timeOffset) + 1.15;
    obstacle.current.setNextKinematicTranslation({
      x: position[0],
      y: position[1] + y,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

export function BlockAxe({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const x = Math.sin(time * speedMultiplier + timeOffset) * 1.25;
    obstacle.current.setNextKinematicTranslation({
      x: position[0] + x,
      y: position[1] + 0.75,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[1.5, 1.5, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

// Two bars in a cross, rotating together — tighter timing windows.
export function BlockDoubleSpinner({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [speed] = useState(
    () => (Math.random() + 0.3) * (Math.random() < 0.5 ? -1 : 1),
  );

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const rotation = new THREE.Quaternion();
    rotation.setFromEuler(new THREE.Euler(0, time * speed * speedMultiplier, 0));
    obstacle.current.setNextKinematicRotation(rotation);
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[0.3, 0.3, 3.5]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

// Heavy ball swinging side to side on a pivot.
export function BlockPendulum({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const x = Math.sin(time * 1.6 * speedMultiplier + timeOffset) * 1.4;
    obstacle.current.setNextKinematicTranslation({
      x: position[0] + x,
      y: position[1] + 0.6,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial
            color="#6b8f3a"
            emissive={PORTAL_GREEN}
            emissiveIntensity={0.15}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}

// Block that slams down from above on a cycle — dash under it.
export function BlockPiston({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    // Sharp slam: stays high, drops fast. abs(sin) raised to a power.
    const wave = Math.abs(Math.sin(time * 2 * speedMultiplier + timeOffset));
    const y = 0.4 + Math.pow(wave, 4) * 1.6;
    obstacle.current.setNextKinematicTranslation({
      x: position[0],
      y: position[1] + y,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[1.6, 1.6, 1.6]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

// Tall wall sweeping across the full width — dodge to one side.
export function BlockSlider({ position = [0, 0, 0] }) {
  const obstacle = useRef();
  const speedMultiplier = useSpeedMultiplier();

  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!obstacle.current) return;
    const time = state.clock.getElapsedTime();
    const x = Math.sin(time * 1.2 * speedMultiplier + timeOffset) * 1.4;
    obstacle.current.setNextKinematicTranslation({
      x: position[0] + x,
      y: position[1] + 0.75,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        ref={obstacle}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[1, 1.5, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

// A swirling Rick & Morty portal — concentric spinning green rings around a
// glowing core, standing upright like a doorway at the finish.
function Portal() {
  const inner = useRef();
  const outer = useRef();
  const core = useRef();
  const portalMat = useRef();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (inner.current) inner.current.rotation.z = time * 1.5;
    if (outer.current) outer.current.rotation.z = -time * 0.9;
    if (core.current) {
      const pulse = 1 + Math.sin(time * 3) * 0.06;
      core.current.scale.set(pulse, pulse, pulse);
    }
    if (portalMat.current) portalMat.current.uTime += delta;
  });

  return (
    <group position={[0, 1.6, -0.3]}>
      {/* Swirling noise-shader core */}
      <mesh ref={core}>
        <circleGeometry args={[1.5, 64]} />
        <portalMaterial
          ref={portalMat}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Swirling rings */}
      <mesh ref={inner} position={[0, 0, 0.02]}>
        <ringGeometry args={[1.5, 1.75, 48]} />
        <meshStandardMaterial
          color={PORTAL_GREEN}
          emissive={PORTAL_GREEN}
          emissiveIntensity={1}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={outer} position={[0, 0, 0.04]}>
        <ringGeometry args={[1.78, 1.95, 48]} />
        <meshStandardMaterial
          color="#5a8f2a"
          emissive="#5a8f2a"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={PORTAL_GREEN} intensity={4} distance={9} />
    </group>
  );
}

export function BlockEnd({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        geometry={boxGeometry}
        material={floor1material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      {/* Finish pad */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial
          color="#5a8f2a"
          emissive={PORTAL_GREEN}
          emissiveIntensity={0.2}
        />
      </mesh>

      <Portal />


      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, 0, 0]}
        restitution={0.2}
        friction={0}
        sensor
      >
        <CuboidCollider args={[1.8, 1, 0.8]} position={[0, 1, 0]} />
      </RigidBody>
    </group>
  );
}

function Bounds({ length = 1 }) {
  return (
    <>
      <RigidBody type="fixed" restitution={0.2} friction={0}>
        <mesh
          position={[2.15, 0.75, -(length * 2) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 4 * length]}
          castShadow
        />
        <mesh
          position={[-2.15, 0.75, -(length * 2) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 4 * length]}
          receiveShadow
        />
        <mesh
          position={[0, 0.75, -(length * 4) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[4, 1.5, 0.3]}
          receiveShadow
        />
        <CuboidCollider
          args={[2, 0.1, 2 * length]}
          position={[0, -0.1, -(length * 2) + 2]}
          restitution={0.2}
          friction={1}
        />
      </RigidBody>
    </>
  );
}

// Each entry: [component, baseWeight, perLevelWeight].
// Harder blocks start rare and become more common as the level climbs.
const BLOCK_POOL = [
  [BlockSpinner, 4, 0],
  [BlockLimbo, 4, 0],
  [BlockAxe, 3, 0.2],
  [BlockSlider, 2, 0.4],
  [BlockPendulum, 1, 0.5],
  [BlockDoubleSpinner, 0.5, 0.6],
  [BlockPiston, 0.5, 0.6],
];

export function Level({ count = 5 }) {
  const blocksSeed = useGame((state) => state.blocksSeed);
  const level = useGame((state) => state.level);

  const blocks = useMemo(() => {
    // Build a weighted pool for the current level.
    const weighted = BLOCK_POOL.map(([type, base, perLevel]) => [
      type,
      base + perLevel * (level - 1),
    ]);
    const totalWeight = weighted.reduce((sum, [, w]) => sum + w, 0);

    const pick = () => {
      let r = Math.random() * totalWeight;
      for (const [type, w] of weighted) {
        r -= w;
        if (r <= 0) return type;
      }
      return weighted[0][0];
    };

    const blocks = [];
    for (let i = 0; i < count; i++) {
      blocks.push(pick());
    }
    return blocks;
  }, [count, blocksSeed, level]);

  return (
    <>
      <BlockStart position={[0, 0, 0]} />
      {blocks.map((Block, index) => (
        <Block key={index} position={[0, 0, -(index + 1) * 4]} />
      ))}
      <BlockEnd position={[0, 0, -(count + 1) * 4]} />
      <Bounds length={count + 2} />
    </>
  );
}

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useGame from "./stores/useGame.js";

/**
 * Ambient dust drifting around the track, plus a burst on win.
 */
export default function Particles({ count = 200 }) {
  const ambientRef = useRef();
  const burstRef = useRef();
  const burstStart = useRef(0);
  const phase = useGame((state) => state.phase);

  // Ambient floating dust positions.
  const ambient = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = -Math.random() * 80 + 5;
    }
    return positions;
  }, [count]);

  // Burst particles with outward velocities (reused each win).
  const burstCount = 120;
  const burst = useMemo(() => {
    const positions = new Float32Array(burstCount * 3);
    const velocities = new Float32Array(burstCount * 3);
    for (let i = 0; i < burstCount; i++) {
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random(),
        Math.random() - 0.5,
      ).normalize();
      const speed = 2 + Math.random() * 3;
      velocities[i * 3 + 0] = dir.x * speed;
      velocities[i * 3 + 1] = dir.y * speed;
      velocities[i * 3 + 2] = dir.z * speed;
    }
    return { positions, velocities };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Drift ambient dust slowly upward, wrapping around.
    if (ambientRef.current) {
      const arr = ambientRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += delta * 0.3;
        if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 0;
        arr[i * 3 + 0] += Math.sin(time + i) * delta * 0.05;
      }
      ambientRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate the win burst when in 'ended' phase.
    if (burstRef.current) {
      if (phase === "ended") {
        if (burstStart.current === 0) {
          burstStart.current = time;
          // Reset burst particles to the finish area.
          const arr = burstRef.current.geometry.attributes.position.array;
          const finishZ = -(useGame.getState().blocksCount + 1) * 4;
          for (let i = 0; i < burstCount; i++) {
            arr[i * 3 + 0] = 0;
            arr[i * 3 + 1] = 0.8;
            arr[i * 3 + 2] = finishZ;
          }
        }
        const elapsed = time - burstStart.current;
        const arr = burstRef.current.geometry.attributes.position.array;
        for (let i = 0; i < burstCount; i++) {
          arr[i * 3 + 0] += burst.velocities[i * 3 + 0] * delta;
          arr[i * 3 + 1] +=
            (burst.velocities[i * 3 + 1] - elapsed * 1.5) * delta;
          arr[i * 3 + 2] += burst.velocities[i * 3 + 2] * delta;
        }
        burstRef.current.geometry.attributes.position.needsUpdate = true;
        burstRef.current.visible = elapsed < 1.5;
      } else {
        burstStart.current = 0;
        burstRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <points ref={ambientRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={ambient}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#6b8f3a"
          transparent
          opacity={0.3}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={burstRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={burstCount}
            array={burst.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color="#aaff5e"
          transparent
          opacity={0.95}
          depthWrite={false}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </>
  );
}

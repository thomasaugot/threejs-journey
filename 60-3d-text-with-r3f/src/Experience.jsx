import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Center,
  OrbitControls,
  Text3D,
  useMatcapTexture,
} from "@react-three/drei";
import { Perf } from "r3f-perf";
import * as THREE from "three";
import { SRGBColorSpace, MeshMatcapMaterial } from "three";

const COUNT = 100;

export default function Experience() {
  const [matCapTexture] = useMatcapTexture("7B5254_E9DCC7_B19986_C8AC91", 256);

  const matcapMaterial = useMemo(() => {
    matCapTexture.colorSpace = SRGBColorSpace;
    return new MeshMatcapMaterial({ matcap: matCapTexture });
  }, [matCapTexture]);
  const instancesRef = useRef();

  const donuts = useMemo(() => {
    const placed = [];
    for (let i = 0; i < 2000 && placed.length < COUNT; i++) {
      const scale = Math.random() + 0.2;
      const position = [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ];
      const tooClose = placed.some((p) => {
        const dx = p.position[0] - position[0];
        const dy = p.position[1] - position[1];
        const dz = p.position[2] - position[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < (p.scale + scale) * 1.4;
      });
      if (!tooClose)
        placed.push({
          position,
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
          scale,
        });
    }
    return placed;
  }, []);

  const rotations = useRef(donuts.map(({ rotation }) => [...rotation]));

  const matrix = useRef(new THREE.Matrix4());
  const euler = useRef(new THREE.Euler());
  const quat = useRef(new THREE.Quaternion());
  const pos = useRef(new THREE.Vector3());
  const scaleVec = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!instancesRef.current) return;
    donuts.forEach(({ position, scale }, i) => {
      rotations.current[i][0] += delta * 0.3;
      rotations.current[i][1] += delta * 0.2;
      euler.current.set(...rotations.current[i]);
      quat.current.setFromEuler(euler.current);
      pos.current.set(...position);
      scaleVec.current.set(scale, scale, scale);
      matrix.current.compose(pos.current, quat.current, scaleVec.current);
      instancesRef.current.setMatrixAt(i, matrix.current);
    });
    instancesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <Perf position="top-left" />

      <OrbitControls makeDefault />

      <Center>
        <Text3D
          font={"/fonts/helvetiker_regular.typeface.json"}
          size={0.75}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
          material={matcapMaterial}
        >
          Hello Three.js
        </Text3D>
      </Center>

      <instancedMesh ref={instancesRef} args={[null, null, COUNT]} material={matcapMaterial}>
        <torusGeometry args={[1, 0.4, 16, 60]} />
      </instancedMesh>
    </>
  );
}

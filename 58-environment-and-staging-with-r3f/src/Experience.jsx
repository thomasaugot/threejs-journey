import { useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useHelper,
  BakeShadows,
  SoftShadows,
  Sky,
  Environment,
  Lightformer,
  Stage,
} from "@react-three/drei";
import { useRef } from "react";
import { Perf } from "r3f-perf";
import * as THREE from "three";
import { useControls } from "leva";

export default function Experience() {
  const cube = useRef();
  const directionalLight = useRef();

  const { perfVisible } = useControls("Scene", {
    perfVisible: true,
  });

  const { lightPosition } = useControls("Lighting", {
    lightPosition: { value: { x: 1, y: 2, z: 3 } },
  });

  const { stagePreset, stageEnv, stageShadows } = useControls("Stage", {
    stagePreset: {
      value: "rembrandt",
      options: ["rembrandt", "portrait", "upfront", "soft"],
    },
    stageEnv: {
      value: "city",
      options: ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"],
    },
    stageShadows: { value: 0.5, min: 0, max: 1, step: 0.01, label: "shadow opacity" },
  });

  const { sphereColor, cubeColor } = useControls("Materials", {
    sphereColor: "#ffa500",
    cubeColor: "#9370db",
  });

  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime();
    cube.current.position.x = Math.cos(elapsedTime) * lightPosition.x;
    cube.current.position.z = Math.sin(elapsedTime) * lightPosition.z;
    cube.current.rotation.y += delta * 0.2;
  });

  return (
    <>
      {/* <Environment
        files="/environmentMaps/the_sky_is_on_fire_2k.hdr"
        background
      /> */}

      {/* <Environment background preset="sunset">
        <color args={['#000000']} attach="background" />
        <Lightformer
          position-z={-5}
          scale={5}
          color="red"
          intensity={10}
          form="ring"
        />
      </Environment> */}

      {perfVisible && <Perf position="top-left" />}

      <OrbitControls makeDefault />

      <Stage
        preset={stagePreset}
        environment={stageEnv}
        shadows={{ type: "contact", opacity: stageShadows, blur: 2 }}
      >
        <mesh castShadow position-x={-2}>
          <sphereGeometry />
          <meshStandardMaterial color={sphereColor} />
        </mesh>

        <mesh ref={cube} castShadow position-x={2} scale={1.5}>
          <boxGeometry />
          <meshStandardMaterial color={cubeColor} />
        </mesh>
      </Stage>
    </>
  );
}

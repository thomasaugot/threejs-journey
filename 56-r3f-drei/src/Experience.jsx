import {
  OrbitControls,
  TransformControls,
  PivotControls,
  Html,
  Text,
  Float,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { useRef } from "react";
import { MeshNormalMaterial } from "three";

export default function Experience() {
  const cubeRef = useRef();

  return (
    <>
      <OrbitControls makeDefault />

      <directionalLight position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />

      <PivotControls
        anchor={[0, 0, 0]}
        depthTest={false}
        lineWidth={4}
        axisColors={["red", "green", "blue"]}
      >
        <mesh position-x={-2}>
          <sphereGeometry />
          <meshStandardMaterial color="orange" />
          <Html
            position={[1, 1, 0]}
            wrapperClass="label"
            center
            distanceFactor={8}
          >
            Hello, world!
          </Html>
        </mesh>
      </PivotControls>

      <mesh ref={cubeRef} position-x={2} scale={1.5}>
        <boxGeometry />
        <meshStandardMaterial color="mediumpurple" />
      </mesh>

      <TransformControls object={cubeRef} mode="translate" />

      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        {/* <meshStandardMaterial color="greenyellow" /> */}
        <MeshReflectorMaterial resolution={512} blur={1000, 1000} mixBlur={1} mirror={0.5} color={"greenYellow"}/>
      </mesh>

      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Text
          font="/bangers-v20-latin-regular.woff"
          fontSize={0.5}
          color="black"
          position-y={2}
        >
          Hello, world!
        </Text>
      </Float>
    </>
  );
}

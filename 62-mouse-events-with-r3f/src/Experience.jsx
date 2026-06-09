import { useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef } from "react";

export default function Experience() {
  const cube = useRef();

  //   useFrame((state, delta) => {
  //     cube.current.rotation.y += delta * 0.2;
  //   });

  //   const eventHandler = (event) => {
  //     cube.current.material.color.set(`hsl(${Math.random() * 360}, 100%, 75%)`);
  //   };

  const model = useGLTF("./hamburger.glb");

  return (
    <>
      <OrbitControls makeDefault />

      <directionalLight position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />

      {/* <mesh position-x={-2}>
        <sphereGeometry />
        <meshStandardMaterial color="orange" />
      </mesh> */}

      {/* <mesh ref={cube} position-x={2} scale={1.5} onPointerEnter={eventHandler}>
        <boxGeometry />
        <meshStandardMaterial color="mediumpurple" />
      </mesh> */}

      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        <meshStandardMaterial color="greenyellow" />
      </mesh>

      <primitive
        object={model.scene}
        position-y={-1}
        scale={0.3}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
        onClick={(event) => {
          alert("Hamburger clicked!");
          event.stopPropagation();
        }}
      />
    </>
  );
}

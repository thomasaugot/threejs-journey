import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Placeholder({ position = [0, 0, 0] }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3) * 0.15;
    meshRef.current.scale.setScalar(pulse);
    meshRef.current.material.opacity = 0.4 + Math.sin(t * 3) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#888888" transparent wireframe />
    </mesh>
  );
}

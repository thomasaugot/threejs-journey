import { OrbitControls } from "@react-three/drei";
import { useControls, button } from "leva";
import { Perf } from "r3f-perf";

export default function Experience() {
  const { lightIntensity } = useControls("Light", {
    lightIntensity: { value: 4.5, min: 0, max: 10, step: 0.1 },
  });

  const { position, color, visible, wireframe } = useControls("Sphere", {
    position: {
      value: { x: -2, y: 0 },
      step: 0.01,
      joystick: "invertY",
    },
    color: { value: "#ff0000" },
    visible: true,
    wireframe: false,
  });

  const { boxColor, boxScale } = useControls("Box", {
    boxColor: { value: "mediumpurple" },
    boxScale: { value: 1.5, min: 0.5, max: 3, step: 0.1 },
  });

  return (
    <>
      <Perf position="top-left"/>

      <OrbitControls makeDefault />

      <directionalLight position={[1, 2, 3]} intensity={lightIntensity} />
      <ambientLight intensity={1.5} />

      <mesh position-x={position.x} position-y={position.y} visible={visible}>
        <sphereGeometry />
        <meshStandardMaterial color={color} wireframe={wireframe} />
      </mesh>

      <mesh position-x={2} scale={boxScale}>
        <boxGeometry />
        <meshStandardMaterial color={boxColor} />
      </mesh>

      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        <meshStandardMaterial color="greenyellow" />
      </mesh>
    </>
  );
}

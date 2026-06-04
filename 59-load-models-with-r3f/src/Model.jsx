import { useGLTF, Clone } from "@react-three/drei";

export default function Model() {
  const model = useGLTF("/FlightHelmet/glTF/FlightHelmet.gltf");

  return (
    <>
      <Clone object={model.scene} scale={3} position-x={-4}/>
      <Clone object={model.scene} scale={2} position-x={0}/>
      <Clone object={model.scene} scale={4} position-x={4}/>
    </>
  );
}

useGLTF.preload("/FlightHelmet/glTF/FlightHelmet.gltf");

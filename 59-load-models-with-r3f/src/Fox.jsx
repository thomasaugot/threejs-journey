import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { useControls } from "leva";

export default function Fox() {
  const model = useGLTF("/Fox/glTF/Fox.gltf");
  const animations = useAnimations(model.animations, model.scene);

  const animationNames = animations.names;

  const { animation } = useControls("Fox", {
    animation: {
      options: animationNames,
      value: animationNames[0],
    },
  });

  useEffect(() => {
    const action = animations.actions[animation];
    action.reset().fadeIn(0.5).play();

    return () => action.fadeOut(0.5);
  }, [animation]);

  return (
    <primitive
      object={model.scene}
      scale={0.02}
      position={[-2.5, 0, 2.5]}
      rotation-y={0.3}
    />
  );
}

useGLTF.preload("/Fox/glTF/Fox.gltf");

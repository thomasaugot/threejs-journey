import { OrbitControls } from "@react-three/drei";
import {
  Bloom,
  Depth,
  DepthOfField,
  EffectComposer,
  Glitch,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { Drunk } from "./DrunkEffect";
import {
  BlendFunction,
  BloomEffect,
  GlitchMode,
  ToneMappingMode,
} from "postprocessing";
import { Perf } from "r3f-perf";
import { useControls } from "leva";

export default function Experience() {
  const { amplitude } = useControls("Drunk Effect", {
    amplitude: { value: 0.1, min: 0, max: 1, step: 0.01 },
  });

  return (
    <>
      <color attach="background" args={["#ffff"]} />
      <EffectComposer multisampling={8}>
        <Drunk amplitude={amplitude} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {/* <Vignette
          offset={0.3}
          darkness={0.9}
          blendFunction={BlendFunction.NORMAL}
        /> */}
        {/* <Glitch
          delay={[0.5, 1]}
          duration={[0.1, 0.3]}
          strength={[0.2, 0.4]}
          mode={GlitchMode.CONSTANT_WILD}
        /> */}
        {/* <Noise premultiply={true} blendFunction={BlendFunction.AVERAGE} /> */}
        {/* <Bloom mipmapBlur /> */}
        {/* <DepthOfField
          focusDistance={0.025}
          focusLength={0.025}
          bokehScale={6}
        /> */}
      </EffectComposer>

      <Perf position="top-left" />

      <OrbitControls makeDefault />

      <directionalLight castShadow position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />

      <mesh castShadow position-x={-2}>
        <sphereGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh castShadow position-x={2} scale={1.5}>
        <boxGeometry />
        <meshStandardMaterial
          color={"purple"}
          //   color={[1.5, 1, 4]}
          //   emissive={"orange"}
          //   emissiveIntensity={10}
          //   toneMapped={false}
        />
      </mesh>

      <mesh
        receiveShadow
        position-y={-1}
        rotation-x={-Math.PI * 0.5}
        scale={10}
      >
        <planeGeometry />
        <meshStandardMaterial color="greenyellow" />
      </mesh>
    </>
  );
}

import { Physics } from "@react-three/rapier";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Lights from "./Lights.jsx";
import { Level } from "./Level.jsx";
import Player from "./Player.jsx";
import Particles from "./Particles.jsx";
import useGame from "./stores/useGame.js";

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);

  return (
    <>
      <color args={["#150a26"]} attach="background" />
      <fog attach="fog" args={["#1d0f33", 12, 32]} />

      <Environment preset="night" />

      <Physics key={blocksSeed}>
        <Lights />
        <Level count={blocksCount} />
        <Player />
      </Physics>

      <Particles />

      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.35}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

import * as THREE from "three";
import { useKeyboardControls, Trail } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import useGame from "./stores/useGame.js";
import { playJump, playWin, setRollSpeed, stopRoll } from "./utils/audio.js";

export default function Player() {
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const body = useRef();
  const { rapier, world } = useRapier();

  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const nextLevel = useGame((state) => state.nextLevel);
  const blocksCount = useGame((state) => state.blocksCount);

  const [smoothedCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10));
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());

  const ball = useRef(); // visual mesh, for the trail anchor
  const fovKick = useRef(0); // transient FOV boost, decays each frame
  const BASE_FOV = 45;

  const reset = () => {
    if (!body.current) return;
    body.current.setTranslation({ x: 0, y: 1, z: 0 });
    body.current.setLinvel({ x: 0, y: 0, z: 0 });
    body.current.setAngvel({ x: 0, y: 0, z: 0 });
  };

  const jump = () => {
    if (!body.current) return;
    const origin = body.current.translation();
    origin.y -= 0.31;
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, 10, true);

    if (hit.timeOfImpact < 0.15) {
      body.current.applyImpulse({ x: 0, y: 0.5, z: 0 });
      playJump();
      fovKick.current = 6; // punchy FOV widen on jump
    }
  };

  useEffect(() => {
    let nextLevelTimeout;

    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === "ready") reset();
        else if (phase === "ended") {
          playWin();
          nextLevelTimeout = setTimeout(() => nextLevel(), 1500);
        }
      },
    );

    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value) jump();
      },
    );

    const unsubscribeAny = subscribeKeys(() => {
      // Only the "ready" phase should kick off a run.
      if (useGame.getState().phase === "ready") start();
    });

    return () => {
      unsubscribeReset();
      unsubscribeJump();
      unsubscribeAny();
      clearTimeout(nextLevelTimeout);
    };
  }, []);

  useFrame((state, delta) => {
    if (!body.current) return;

    const phase = useGame.getState().phase;
    const frozen = phase === "paused" || phase === "menu";

    const { forward, backward, leftward, rightward } = getKeys();
    const impulse = { x: 0, y: 0, z: 0 };
    const torque = { x: 0, y: 0, z: 0 };

    const impulseStrength = 0.6 * delta;
    const torqueStrength = 0.2 * delta;

    if (!frozen) {
      if (forward) {
        impulse.z -= impulseStrength;
        torque.x -= torqueStrength;
      }
      if (rightward) {
        impulse.x += impulseStrength;
        torque.z -= torqueStrength;
      }
      if (backward) {
        impulse.z += impulseStrength;
        torque.x += torqueStrength;
      }
      if (leftward) {
        impulse.x -= impulseStrength;
        torque.z += torqueStrength;
      }

      body.current.applyImpulse(impulse);
      body.current.applyTorqueImpulse(torque);
    }

    // Rolling sound tracks horizontal speed (silent when frozen).
    if (frozen) {
      stopRoll();
    } else {
      const v = body.current.linvel();
      const speed = Math.hypot(v.x, v.z);
      setRollSpeed(speed);
    }

    // CAMERA
    const bodyPosition = body.current.translation();

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(bodyPosition);
    cameraPosition.z += 2.25;
    cameraPosition.y += 0.65;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    smoothedCameraPosition.lerp(cameraPosition, 5 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

    state.camera.position.copy(smoothedCameraPosition);
    state.camera.lookAt(smoothedCameraTarget);

    // FOV punch: kick on jump, decay back to base.
    fovKick.current = THREE.MathUtils.lerp(fovKick.current, 0, 6 * delta);
    const targetFov = BASE_FOV + fovKick.current;
    if (Math.abs(state.camera.fov - targetFov) > 0.01) {
      state.camera.fov = targetFov;
      state.camera.updateProjectionMatrix();
    }

    // PHASES
    if (bodyPosition.z < -(blocksCount * 4 + 2)) {
      end();
    }

    if (bodyPosition.y < -4) {
      restart();
    }
  });

  return (
    <RigidBody
      position={[0, 1, 0]}
      colliders="ball"
      restitution={0.2}
      friction={1}
      ref={body}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <Trail
        width={1.2}
        length={5}
        color={"#97ce4c"}
        attenuation={(t) => t * t}
      >
        <mesh ref={ball} castShadow>
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial
            flatShading
            color="#8fb84a"
            emissive="#97ce4c"
            emissiveIntensity={0.25}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </Trail>
    </RigidBody>
  );
}

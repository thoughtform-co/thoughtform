"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";

const HAZE_COLOR = new THREE.Color("#c7d0bb");
const FOG_COLOR = new THREE.Color("#090807");

/**
 * Lightweight in-scene haze for phase handoffs.
 *
 * We intentionally avoid a heavier postprocessing stack here so `/v4` gains a
 * real atmospheric transition without introducing another fragile render
 * pipeline. The shared transitionRef still lets DOM and scene layers breathe
 * together during the manifesto → services handoff.
 */
export function SceneBlur() {
  const { scene } = useThree();
  const { transitionRef } = useParticleScene();
  const veilRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const fogRef = useRef(new THREE.FogExp2(FOG_COLOR, 0));
  const forwardRef = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  const tmpVecRef = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const previousFog = scene.fog;
    const fog = fogRef.current;
    scene.fog = fog;

    return () => {
      if (scene.fog === fog) {
        scene.fog = previousFog;
      }
    };
  }, [scene]);

  useFrame(({ camera }) => {
    const transition = transitionRef.current;
    const targetOpacity = transition.haze * 0.34;
    const targetDensity = 0.00006 + transition.haze * 0.00075;

    fogRef.current.density += (targetDensity - fogRef.current.density) * 0.1;

    if (materialRef.current) {
      materialRef.current.opacity += (targetOpacity - materialRef.current.opacity) * 0.12;
    }

    if (veilRef.current) {
      tmpVecRef.copy(forwardRef).applyQuaternion(camera.quaternion).multiplyScalar(180);
      veilRef.current.position.copy(camera.position).add(tmpVecRef);
      veilRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <mesh ref={veilRef} frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[420, 260]} />
      <meshBasicMaterial
        ref={materialRef}
        color={HAZE_COLOR}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

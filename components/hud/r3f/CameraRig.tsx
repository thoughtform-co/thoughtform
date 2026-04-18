"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { SCENE_DEPTH } from "./phases";

const CAMERA_START_Y = 120;
const CAMERA_START_Z = 900;

/**
 * Drives camera position from the scrollRef populated by the parent DOM.
 * Camera glides forward (into negative Z) as the user scrolls deeper.
 */
export function CameraRig() {
  const { camera } = useThree();
  const { scrollRef } = useParticleScene();

  useFrame(() => {
    const progress = scrollRef.current?.progress ?? 0;
    const targetZ = CAMERA_START_Z - progress * SCENE_DEPTH;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.position.y = CAMERA_START_Y - progress * 40;
    camera.lookAt(0, CAMERA_START_Y * 0.6, targetZ - 600);
  });

  return null;
}

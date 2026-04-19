"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { getPhaseAtProgress, SCENE_DEPTH } from "./phases";

/**
 * Populates ParticleSceneContext refs from inside the R3F canvas.
 * Must be mounted as a child of <Canvas>.
 */
export function SceneBinder() {
  const { camera, size } = useThree();
  const { cameraRef, dimensionsRef, scrollRef, phaseRef } = useParticleScene();

  cameraRef.current = camera;

  useEffect(() => {
    dimensionsRef.current = { width: size.width, height: size.height };
  }, [size.width, size.height, dimensionsRef]);

  useFrame(() => {
    const progress = scrollRef.current?.progress ?? 0;
    if (scrollRef.current) {
      scrollRef.current.z = progress * SCENE_DEPTH;
    }
    const phase = getPhaseAtProgress(progress);
    if (phaseRef.current) {
      phaseRef.current.section = phase.section;
      phaseRef.current.progress = phase.progress;
    }
  });

  return null;
}

"use client";

/**
 * ServicesHologramScene — composes the volumetric brandmark artifact and the
 * 3D orbit rings into ONE shared perspective scene (the whole point: the
 * mark and the orbits finally live in the same coordinate space and camera,
 * so the rings genuinely weave around the artifact in depth).
 *
 * This component renders scene CONTENTS only (no <Canvas>). The host — the
 * lab page now, the production Services stage later — owns the Canvas,
 * camera, and controls so the same scene can be driven by a slider in the
 * lab or by scroll in production.
 */

import { HologramArtifact, type HologramArtifactProps } from "./HologramArtifact";
import { HologramOrbits, type OrbitConfig } from "./HologramOrbits";

export interface ServicesHologramSceneProps extends Omit<HologramArtifactProps, "scale"> {
  /** World scale shared by the artifact and the orbits. */
  scale?: number;
  /** Show the 3D orbit rings. */
  showOrbits?: boolean;
  orbits?: readonly OrbitConfig[];
  /** Speed (rad/s) the orbital armature sweeps around the mark. */
  orbitsRotate?: number;
}

export function ServicesHologramScene({
  scale = 1,
  showOrbits = true,
  orbits,
  orbitsRotate,
  ...artifact
}: ServicesHologramSceneProps) {
  return (
    <group>
      <HologramArtifact {...artifact} scale={scale} />
      {showOrbits && <HologramOrbits orbits={orbits} scale={scale} rotateSpeed={orbitsRotate} />}
    </group>
  );
}

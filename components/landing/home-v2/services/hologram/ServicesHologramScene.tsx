"use client";

/**
 * ServicesHologramScene — composes the volumetric brandmark artifact and the
 * 3D orbit rings into ONE shared perspective scene (the whole point: the
 * mark and the orbits finally live in the same coordinate space and camera,
 * so the rings genuinely weave around the artifact in depth).
 *
 * The centerpiece is `VolumetricBrandmarkArtifact` — particles sampled from
 * the real 3D Blender brandmark mesh, holding a static 3/4 pose with subtle
 * pointer parallax (NOT a flat billboard). It loads a GLB, so it's wrapped in
 * <Suspense>.
 *
 * This component renders scene CONTENTS only (no <Canvas>). The host — the
 * lab page now, the production Services stage later — owns the Canvas,
 * camera, and controls so the same scene can be driven by a slider in the
 * lab or by scroll in production.
 */

import { Suspense, useEffect } from "react";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import type { ServiceId } from "../serviceData";
import { HologramOrbits, type OrbitConfig } from "./HologramOrbits";
import {
  VolumetricBrandmarkArtifact,
  type VolumetricBrandmarkArtifactProps,
} from "./VolumetricBrandmarkArtifact";

export interface ServicesHologramSceneProps extends Omit<
  VolumetricBrandmarkArtifactProps,
  "scale"
> {
  /** World scale shared by the artifact and the orbits. */
  scale?: number;
  /** Show the 3D orbit rings. */
  showOrbits?: boolean;
  orbits?: readonly OrbitConfig[];
  /** Speed (rad/s) the orbital armature sweeps around the mark. */
  orbitsRotate?: number;
  activeServiceId?: ServiceId;
  showShell?: boolean;
  /** Publish projected orbit-node anchors to the HUD connector store. */
  publishAnchors?: boolean;
}

export function ServicesHologramScene({
  scale = 1,
  showOrbits = true,
  activeServiceId,
  orbits,
  orbitsRotate,
  publishAnchors = false,
  showShell = true,
  ...artifact
}: ServicesHologramSceneProps) {
  const setAnchors = useHologramConnectors((s) => s.setAnchors);
  const { shellCount, ...artifactRest } = artifact;

  useEffect(() => {
    if (!publishAnchors) return;
    return () => setAnchors([]);
  }, [publishAnchors, setAnchors]);

  return (
    <group>
      <Suspense fallback={null}>
        <VolumetricBrandmarkArtifact
          {...artifactRest}
          shellCount={showShell ? shellCount : 0}
          scale={scale}
        />
      </Suspense>
      {showOrbits && (
        <HologramOrbits
          activeServiceId={activeServiceId}
          orbits={orbits}
          scale={scale}
          rotateSpeed={orbitsRotate}
          publishAnchors={publishAnchors ? setAnchors : undefined}
          entrance={artifactRest.entrance}
        />
      )}
    </group>
  );
}

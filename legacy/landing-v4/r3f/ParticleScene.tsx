"use client";

import { SceneBinder } from "./SceneBinder";
import { SceneAnchors } from "./SceneAnchors";
import { CameraRig } from "./CameraRig";
import { Terrain } from "./Terrain";
import { ContinuumSpectrumField } from "./ContinuumSpectrumField";

/**
 * The in-canvas scene composition.
 *
 * Note: the hero-phase gateway wormhole remains as a separate R3F overlay
 * (components/hud/ThreeGateway) in v4 for continuity. See GatewaySigil3D.tsx
 * for an alternative ring/crosshair sigil that can replace it in a follow-up.
 */
export function ParticleScene() {
  return (
    <>
      <SceneBinder />
      <SceneAnchors />
      <CameraRig />
      <Terrain />
      <ContinuumSpectrumField />
    </>
  );
}

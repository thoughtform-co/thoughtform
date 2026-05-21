"use client";

import { DiagnosticOrbitGate } from "./DiagnosticOrbitGate";
import { InterstitialDiagramGate } from "./InterstitialDiagramGate";
import { ThoughtformCompassGate } from "./ThoughtformCompassGate";

/**
 * GatewayWorld — composes the four world-space diagram gates that
 * make up the home-v2 depth corridor (ADR-018).
 *
 * Each gate owns its own world position from `sceneGeom.ts`:
 *
 *   - ThoughtformCompassGate    — concentric rings + centre diamond
 *   - DiagnosticOrbitGate       — four asymmetric orbits + pips
 *   - InterstitialDiagramGate   — armature + tilted passage + diamond
 *   - (Intelligence sphere/side bodies — owned by `IntelligenceChamber`)
 *
 * Each gate manages its own visibility envelope via the depth store
 * so this composer stays a pure JSX collector — no scroll logic
 * here. The intelligence sphere station lives in the existing
 * `IntelligenceChamber` component because it composes with the
 * projected brandmark + substrate morph cover.
 */
export function GatewayWorld() {
  return (
    <>
      <ThoughtformCompassGate />
      <DiagnosticOrbitGate />
      <InterstitialDiagramGate />
    </>
  );
}

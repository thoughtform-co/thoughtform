"use client";

import { DiagnosticOrbitGate } from "./DiagnosticOrbitGate";
import { InterstitialDiagramGate } from "./InterstitialDiagramGate";

/**
 * GatewayWorld — composes the world-space diagram gates of the
 * home-v2 depth corridor (ADR-018).
 *
 * Each gate owns its own world position from `sceneGeom.ts`:
 *
 *   - DiagnosticOrbitGate       — four asymmetric orbits + pips
 *   - InterstitialDiagramGate   — armature + tilted passage + diamond
 *   - (Intelligence sphere/side bodies — owned by `IntelligenceChamber`)
 *
 * The Thoughtform parked beat does NOT have an R3F compass: the v7
 * `.sigil__orbits` SVG (homepage-fidelity rings + phase labels +
 * diamond) is left visible during that beat instead, with the
 * `ProjectedBrandmarkActor` pinned to its `.sigil__mark` dock rect.
 * As the camera enters the passthrough beat the chamber section
 * fades out via `--chamber-A-section-opacity` and the corridor's
 * subsequent gates (Diagnostic, Interstitial, Intelligence) carry
 * the 3D pass-through narrative.
 *
 * Each gate manages its own visibility envelope via the depth store
 * so this composer stays a pure JSX collector — no scroll logic
 * here.
 */
export function GatewayWorld() {
  return (
    <>
      <DiagnosticOrbitGate />
      <InterstitialDiagramGate />
    </>
  );
}

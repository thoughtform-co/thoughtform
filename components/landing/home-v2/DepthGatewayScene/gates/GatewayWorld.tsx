"use client";

import { IntelligenceGate } from "./IntelligenceGate";
import { InterstitialDiagramGate } from "./InterstitialDiagramGate";
import { NavigateGate } from "./NavigateGate";
import { ThoughtformCompassGate } from "./ThoughtformCompassGate";

/**
 * GatewayWorld — composes the world-space gate groups of the home-v2
 * depth corridor (ADR-018, world-owned rebuild).
 *
 * Each gate manages its own visibility envelope from the depth store
 * so this composer stays a pure JSX collector — no scroll logic
 * here. All gates are world-rigid groups at their own Z stations;
 * the camera flies through them on one continuous path.
 *
 *   - ThoughtformCompassGate    — concentric rings + phase nodes
 *                                 (replaces v7 SVG compass end-to-end;
 *                                 no bounding diamond).
 *   - NavigateGate              — armature + tilted ring + compass
 *                                 cross (Navigate's place in the
 *                                 corridor; fly-through landmark).
 *   - InterstitialDiagramGate   — armature + tilted ring + diamond.
 *   - IntelligenceGate          — substrate sphere (Build); the
 *                                 dodecahedron cage + outer surfaces
 *                                 wrapping it arrive via the accreted
 *                                 `BrandmarkAccretionShell` (which is
 *                                 co-located with the substrate
 *                                 sphere at landing).
 *
 * The Encode (Diagnostic) station has no standalone gate of its own
 * anymore — the accreted `BrandmarkAccretionShell` carries the
 * solar-system source orbits, and the brandmark coincides with the
 * Diagnostic gate plane at park (see `getBrandmarkLeadWorldPosition`)
 * so the orbits read as centred on the Encode beat.
 */
export function GatewayWorld() {
  return (
    <>
      <ThoughtformCompassGate />
      <NavigateGate />
      <InterstitialDiagramGate />
      <IntelligenceGate />
    </>
  );
}

"use client";

import { DiagnosticOrbitGate } from "./DiagnosticOrbitGate";
import { IntelligenceGate } from "./IntelligenceGate";
import { InterstitialDiagramGate } from "./InterstitialDiagramGate";
import { ThoughtformCompassGate } from "./ThoughtformCompassGate";

/**
 * GatewayWorld — composes the world-space gate groups of the home-v2
 * depth corridor (ADR-018, world-owned rebuild).
 *
 * Each gate manages its own visibility envelope from the depth store
 * so this composer stays a pure JSX collector — no scroll logic
 * here. All four gates are world-rigid groups at their own Z
 * stations; the camera flies through them on one continuous path.
 *
 *   - ThoughtformCompassGate    — concentric rings + diamond +
 *                                 phase nodes (replaces v7 SVG
 *                                 compass end-to-end).
 *   - DiagnosticOrbitGate       — 4 asymmetric orbits + pips.
 *   - InterstitialDiagramGate   — armature + tilted ring + diamond.
 *   - IntelligenceGate          — substrate sphere + side bodies +
 *                                 brandmark substrate-cut shader.
 */
export function GatewayWorld() {
  return (
    <>
      <ThoughtformCompassGate />
      <DiagnosticOrbitGate />
      <InterstitialDiagramGate />
      <IntelligenceGate />
    </>
  );
}

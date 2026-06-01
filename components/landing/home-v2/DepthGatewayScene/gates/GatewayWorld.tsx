"use client";

import { DiagnosticOrbitGate } from "./DiagnosticOrbitGate";
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
 * here. All four gates are world-rigid groups at their own Z
 * stations; the camera flies through them on one continuous path.
 *
 *   - ThoughtformCompassGate    — concentric rings + phase nodes
 *                                 (replaces v7 SVG compass end-to-end;
 *                                 no bounding diamond).
 *   - NavigateGate              — armature + tilted ring + compass
 *                                 cross (Navigate's place in the
 *                                 corridor; fly-through landmark).
 *   - DiagnosticOrbitGate       — 4 asymmetric orbits + pips (Encode).
 *   - InterstitialDiagramGate   — armature + tilted ring + diamond.
 *   - IntelligenceGate          — substrate sphere + side bodies +
 *                                 brandmark substrate-cut shader (Build).
 */
export function GatewayWorld() {
  return (
    <>
      <ThoughtformCompassGate />
      <NavigateGate />
      <DiagnosticOrbitGate />
      <InterstitialDiagramGate />
      <IntelligenceGate />
    </>
  );
}

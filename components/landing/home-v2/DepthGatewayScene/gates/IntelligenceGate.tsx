"use client";

/**
 * IntelligenceGate — the world-rigid gate slot at
 * `STATION_INTELLIGENCE` (ADR-018, world-owned rebuild).
 *
 * Now EMPTY. The substrate morph cloud that used to live here
 * (brandmark shape <-> Fibonacci sphere particle morph at the Build
 * beat) was removed on 2026-06-06 user feedback: the brandmark
 * should stay the same 2D SVG mark (`ProjectedBrandmarkActor`)
 * across all three phases — Navigate, Encode, AND Build — and never
 * turn into a particle sphere or a particle version of the logo.
 *
 * The Build climax is now the assembled accretion shell (low-poly
 * brain + source orbits + outer surfaces skin, via
 * `BrandmarkAccretionShell`) wrapping the persistent DOM brandmark
 * at the centre — no particle substrate.
 *
 * Kept as a null placeholder so `GatewayWorld` stays a declarative
 * gate collector and any future Intelligence-anchored geometry has
 * a clear mounting point.
 */
export function IntelligenceGate() {
  return null;
}

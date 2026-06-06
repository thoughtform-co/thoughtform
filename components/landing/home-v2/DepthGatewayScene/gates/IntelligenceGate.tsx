"use client";

/**
 * IntelligenceGate — the world-rigid 3D group at
 * `STATION_INTELLIGENCE` (ADR-018, world-owned rebuild).
 *
 * After the 2026-06-06 wrap-around revision (Phase 4) the substrate
 * morph cloud was promoted to a TRAVELING brandmark cloud that
 * follows `getBrandmarkWorldPosition` end-to-end (see
 * `TravelingBrandmarkCloud`), so this gate is now empty — there is
 * no Intelligence-anchored geometry: the assembled accretion shell
 * (`BrandmarkAccretionShell`) lands at the Intelligence position by
 * tracking the mark, and the cloud itself paints from inside the
 * traveling component. The component is kept as a placeholder in
 * `GatewayWorld` so the gate composition stays declarative and
 * future Intelligence-anchored geometry has a clear mounting point.
 */
export function IntelligenceGate() {
  return null;
}

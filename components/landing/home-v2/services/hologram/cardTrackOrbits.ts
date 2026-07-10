/**
 * cardTrackOrbits — maps the ADR-029 Update-1 card-orbit geometries onto
 * `HologramOrbits` configs, so each service card's own orbital track is
 * drawn by the exact ellipse parametrization the card rides
 * (`placeCardOnOrbit` shares point(a) = Euler(tilt)·(cos a·r, sin a·r·ecc, 0)).
 *
 * Stroke styles are deliberately varied (Vince: "some are dotted, others a
 * bit thick") from the DEFAULT_ORBITS dash vocabulary, quieter than the
 * waist ring's 0.68 so the tracks read as guides, not structure. Ids are
 * NOT ServiceIds — the `activeServiceId` highlight stays inert on tracks
 * (navigation affordance is composition-only per the 2026-07-10 review).
 *
 * `phase0 = π/2` starts each line's draw-on at the FRONT of the ring
 * (a = π/2 ↔ φ = 0), and reveal windows lead the card entrance windows by
 * `RING_TRACK_REVEAL_LEAD` so every track is on screen just before its
 * card flies in along it.
 */

import type { OrbitConfig } from "./HologramOrbits";
import { SERVICES_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";
import {
  RING_ENTRANCE_WINDOWS,
  RING_TRACK_REVEAL_LEAD,
  type CardOrbitGeometry,
} from "@/lib/services-ring/ringMath";

interface TrackStyle {
  lineWidth: number;
  dashed: boolean;
  dashSize?: number;
  gapSize?: number;
  color: string;
  opacity: number;
}

/** Per-card stroke variety: dotted / thin / thick / solid. */
const TRACK_STYLES: readonly TrackStyle[] = [
  {
    lineWidth: 1.0,
    dashed: true,
    dashSize: 0.022,
    gapSize: 0.16,
    color: SERVICES_GOLD,
    opacity: 0.3,
  },
  { lineWidth: 0.85, dashed: false, color: TENSOR_ACCENT, opacity: 0.22 },
  { lineWidth: 2.2, dashed: false, color: SERVICES_GOLD, opacity: 0.38 },
  { lineWidth: 1.4, dashed: false, color: TENSOR_ACCENT, opacity: 0.26 },
];

export function buildCardTrackOrbits(
  geometries: readonly CardOrbitGeometry[],
  options: { opacityMul?: number } = {}
): OrbitConfig[] {
  const { opacityMul = 1 } = options;
  return geometries.map((geom, i) => {
    const style = TRACK_STYLES[Math.min(i, TRACK_STYLES.length - 1)];
    const window = RING_ENTRANCE_WINDOWS[Math.min(i, RING_ENTRANCE_WINDOWS.length - 1)];
    const config: OrbitConfig = {
      id: `card-track-${i}`,
      radius: geom.radius,
      tilt: [geom.tiltX, 0, geom.tiltZ],
      eccentricity: geom.ecc,
      color: style.color,
      opacity: Math.min(1, style.opacity * opacityMul),
      lineWidth: style.lineWidth,
      dashed: style.dashed,
      node: false,
      phase0: Math.PI / 2,
      reveal: [
        Math.max(0, window[0] - RING_TRACK_REVEAL_LEAD),
        Math.max(0.01, window[1] - RING_TRACK_REVEAL_LEAD),
      ],
    };
    if (style.dashed) {
      config.dashSize = style.dashSize;
      config.gapSize = style.gapSize;
    }
    return config;
  });
}

/**
 * hologramConnectorStore — bridges the 3D hologram scene and the 2D HUD
 * overlays.
 *
 * A projector component inside the R3F canvas (production: `CorridorArmillary`)
 * computes, each parked frame, the screen-space pixel position of each
 * "anchor" — a detected point on the artifact. Two anchor sets are published
 * side-by-side:
 *
 *   - `anchors`: one per `ServiceId`. The service cards' leader lines target
 *     these (Sutera / Blue-Flax CV-scan look — the CORNER anchors the plate
 *     connectors terminate on).
 *   - `featureAnchors`: named designation points on the wireframe (see
 *     `BrandmarkFeatureId`). The designation layer pins small mono callouts
 *     to these (AI STRATEGY, GOVERNANCE, ENCODED SKILLS, ...), which swap
 *     with the active service via a scramble-decode.
 *
 * Both sets ride the same projection pipeline (world → clip → screen px)
 * gated on the same "parked" threshold, so a change in the mark's pose /
 * pointer-look updates both in lockstep.
 */

import { create } from "zustand";
import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";
import type { BrandmarkFeatureId } from "@/components/landing/home-v2/brandmarkScanAnchorsRef";

export interface ConnectorAnchor {
  serviceId: ServiceId;
  /** Screen-space pixel X. */
  x: number;
  /** Screen-space pixel Y. */
  y: number;
  /** Projected clip-space depth. Lower values are closer to the camera. */
  depth: number;
  /** False when the anchor is behind the camera / off-clip. */
  visible: boolean;
}

export interface FeatureAnchor {
  featureId: BrandmarkFeatureId;
  /** Screen-space pixel X. */
  x: number;
  /** Screen-space pixel Y. */
  y: number;
  /** Projected clip-space depth. */
  depth: number;
  /** False when the anchor is behind the camera / off-clip. */
  visible: boolean;
}

interface HologramConnectorState {
  anchors: ConnectorAnchor[];
  setAnchors: (anchors: ConnectorAnchor[]) => void;
  /** Named designation feature anchors. Same projection pipeline as
   *  `anchors`; separate slice so the designation layer can subscribe
   *  without waking every plate connector on service anchor changes and
   *  vice versa. */
  featureAnchors: FeatureAnchor[];
  setFeatureAnchors: (anchors: FeatureAnchor[]) => void;
  /** The service the visitor is currently scanning. Bridges the DOM scan UI
   *  (in `#services`) to the brandmark instrument that now lives in the corridor
   *  canvas (the unified `CorridorArmillary`), so the active orbit ring still
   *  highlights even though the mark + orbits and the scan cards are in different
   *  render trees. `null` until the section sets it (consumer defaults to the
   *  first service). */
  activeServiceId: ServiceId | null;
  setActiveServiceId: (serviceId: ServiceId | null) => void;
}

export const useHologramConnectors = create<HologramConnectorState>((set) => ({
  anchors: [],
  setAnchors: (anchors) => set({ anchors }),
  featureAnchors: [],
  setFeatureAnchors: (featureAnchors) => set({ featureAnchors }),
  activeServiceId: null,
  setActiveServiceId: (activeServiceId) => set({ activeServiceId }),
}));

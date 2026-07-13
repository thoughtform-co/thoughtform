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

/** Screen-space bounding rect of one orbiting service card (ADR-029 ring).
 *  Published by `ServicesCardRing` when the instrument is parked; consumed
 *  by the DOM hit-area layer so the side/back cards stay clickable while the
 *  canvas itself remains `pointer-events: none`. */
export interface RingCardAnchor {
  serviceId: ServiceId;
  /** Bounding-rect left, in viewport px. */
  x: number;
  /** Bounding-rect top, in viewport px. */
  y: number;
  /** Bounding-rect size, in viewport px. */
  w: number;
  h: number;
  /** Projected clip-space depth of the card centre. */
  depth: number;
  /** False when off-clip or faded out (back-of-ring cards). */
  visible: boolean;
  /** True for the card currently facing the camera. */
  front: boolean;
}

/** Screen-space bounding rect of one orbiting CASE card (ADR-033 arc
 *  cases ring). The services `RingCardAnchor` shape with a case identity:
 *  `slot` is the ring position (what the hit layer steps to), `caseId`
 *  the PROJECT_CASES id — kept as a plain string so the store stays
 *  decoupled from the tools-cards data module. Publisher: `ArcCasesRing`
 *  only, while the orbit is armed at the Build park. */
export interface ArcRingCardAnchor {
  caseId: string;
  /** Ring slot 0..3 — `arcCasesStore.stepToCase` target. */
  slot: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Projected clip-space depth of the card centre. */
  depth: number;
  visible: boolean;
  front: boolean;
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
  /** Card rects from the orbiting ring (ADR-029). Separate slice for the
   *  same reason as `featureAnchors`. Publisher: `ServicesCardRing` only. */
  ringAnchors: RingCardAnchor[];
  setRingAnchors: (anchors: RingCardAnchor[]) => void;
  /** Card rects from the Build-park cases orbit (ADR-033). Separate slice
   *  so the two rings' hit layers never wake each other (their visibility
   *  windows are disjoint by contract, but the slices stay independent).
   *  Publisher: `ArcCasesRing` only. */
  arcRingAnchors: ArcRingCardAnchor[];
  setArcRingAnchors: (anchors: ArcRingCardAnchor[]) => void;
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
  ringAnchors: [],
  setRingAnchors: (ringAnchors) => set({ ringAnchors }),
  arcRingAnchors: [],
  setArcRingAnchors: (arcRingAnchors) => set({ arcRingAnchors }),
  activeServiceId: null,
  setActiveServiceId: (activeServiceId) => set({ activeServiceId }),
}));

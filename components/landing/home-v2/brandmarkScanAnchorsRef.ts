/**
 * brandmarkScanAnchorsRef — group-LOCAL anchor points ON the brandmark
 * wireframe, shared between two corridor-canvas actors (same module-ref
 * pattern as `brandmarkScreenRectRef`):
 *
 *   - WRITER: `BrandmarkPhysicsCoreWithGLB` (BrandmarkPhysicsCoreActor.tsx)
 *     derives the points from the SAMPLED GLB wireframe homes right after
 *     normalising them to the group's ±0.5 half-extent — so each anchor is
 *     guaranteed to sit on an actual wireframe edge, not a guessed offset.
 *   - READER: `CorridorArmillary` projects the points to screen pixels each
 *     parked frame (they inherit the mark's pose/pointer-look because both
 *     live under the same `pointerLookRef` group) and publishes them to
 *     `hologramConnectorStore` for the #services CV-scan leader lines and
 *     the designation layer.
 *
 * There are TWO anchor sets — kept distinct so a change to one never has
 * to touch the other:
 *
 *   1. Service anchors (`points`, one per ServiceId): the CORNER anchors
 *      the plate connectors target. Each service's card sits in a specific
 *      rack quadrant, and the anchor sits at the interior wireframe vertex
 *      closest to that quadrant — Keynote upper-left, Workshop lower-left,
 *      Embedded upper-right, Guided Build lower-right (ADR-025 Update 9).
 *      Cards annotate REGIONS OF THE MARK ITSELF (Sutera look).
 *   2. Feature anchors (`features`, keyed by `BrandmarkFeatureId`): NAMED
 *      designation points spread across the mark that the designation
 *      layer pins accessible labels to (AI STRATEGY, GOVERNANCE, ENCODED
 *      SKILLS, ...). These are separate from the four corner anchors so
 *      the designation set can change per service without recomputing
 *      corner points.
 */

import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";

export type BrandmarkScanAnchorPoints = Record<ServiceId, readonly [number, number, number]>;

/** Named designation features on the wireframe. Kept small and semantic
 *  (not per-vertex ids): each maps to a stable region of the mark so the
 *  designation-layer labels can reference the same features across
 *  services without every service needing to know the vertex geometry. */
export type BrandmarkFeatureId =
  | "crown"
  | "upper-left-arm"
  | "upper-right-arm"
  | "core"
  | "lower-left-arm"
  | "lower-right-arm"
  | "base";

export type BrandmarkFeaturePoints = Record<BrandmarkFeatureId, readonly [number, number, number]>;

export interface BrandmarkScanAnchors {
  points: BrandmarkScanAnchorPoints;
  features: BrandmarkFeaturePoints;
}

export const brandmarkScanAnchorPointsRef: {
  current: BrandmarkScanAnchors | null;
} = {
  current: null,
};

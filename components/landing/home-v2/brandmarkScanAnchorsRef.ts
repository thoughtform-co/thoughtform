/**
 * brandmarkScanAnchorsRef — group-LOCAL anchor points ON the brandmark
 * wireframe, one per service, shared between two corridor-canvas actors
 * (same module-ref pattern as `brandmarkScreenRectRef`):
 *
 *   - WRITER: `BrandmarkPhysicsCoreWithGLB` (BrandmarkPhysicsCoreActor.tsx)
 *     derives the points from the SAMPLED GLB wireframe homes right after
 *     normalising them to the group's ±0.5 half-extent — so each anchor is
 *     guaranteed to sit on an actual wireframe edge, not a guessed offset.
 *   - READER: `CorridorArmillary` projects the points to screen pixels each
 *     parked frame (they inherit the mark's pose/pointer-look because both
 *     live under the same `pointerLookRef` group) and publishes them to
 *     `hologramConnectorStore` for the #services CV-scan leader lines.
 *
 * The scan cards therefore annotate REGIONS OF THE MARK ITSELF (Sutera
 * look): Keynote → upper-left feature, Workshop → lower-left feature,
 * Embedded → upper-right feature, matching each card's screen corner.
 */

import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";

export type BrandmarkScanAnchorPoints = Record<ServiceId, readonly [number, number, number]>;

export const brandmarkScanAnchorPointsRef: { current: BrandmarkScanAnchorPoints | null } = {
  current: null,
};

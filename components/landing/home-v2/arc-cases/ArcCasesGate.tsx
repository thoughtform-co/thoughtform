"use client";

/**
 * ArcCasesGate — the production mount for the ADR-033 cases orbit, a
 * sibling of `CorridorArmillary` inside the actor's `pointerLookRef`
 * group. Applies the capability gate (which MUST match the CTA host
 * layer — see `ARC_CASES_MEDIA`) and assembles the scroll-owned band
 * getter the ring multiplies against its click-owned arm level:
 *
 *   Build-band rise × epilogue kill × corridor-exit dissipate guard
 *
 * The dissipate guard mirrors the `BrandmarkPhysicsCoreActor` read
 * (`t.docked || t.servicesAmbient` gates the smoothed dissipate) and is
 * the belt-and-suspenders half of the ADR-033 exclusivity contract: the
 * services ring cannot enter before dissipate ≥ 0.6, the cases ring is
 * dead past 0.15 — the two rings never co-render in the shared canvas.
 */

import { ArcCasesRing } from "./ArcCasesRing";
import { ARC_CASES_MEDIA } from "../arcCasesOrbit";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "../DepthGatewayScene/motionFollower";
import { arcBandFactor } from "@/lib/arc-cases/orbitMath";
import { smootherstep } from "@/lib/services-ring/ringMath";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/** Orbit scale relative to the core's group — the `CorridorArmillary`
 *  value, so the cases ring lives in the same orbit-config space as the
 *  services ring and the accretion sphere frame it identically. */
const ARMILLARY_SCALE = 0.62;

export function ArcCasesGate() {
  const capable = useMediaQuery(ARC_CASES_MEDIA);
  if (!capable) return null;
  return <ArcCasesRing scale={ARMILLARY_SCALE} bandGetter={corridorBandGetter} publishAnchors />;
}

function corridorBandGetter(): number {
  const t = useDepthGatewayStore.getState().transform;
  if (!t.active && !t.armed) return 0;
  const dissipate = t.docked || t.servicesAmbient ? getSmoothedDissipate() : 0;
  return (
    arcBandFactor(t.paintProgress, getSmoothedEpilogueProgress()) *
    (1 - smootherstep(0, 0.15, dissipate))
  );
}

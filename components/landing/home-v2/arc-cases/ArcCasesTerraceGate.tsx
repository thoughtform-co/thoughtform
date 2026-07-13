"use client";

/**
 * ArcCasesTerraceGate — production mount for the terrace screen
 * (ADR-034). Applies the desktop capability gate (`ARC_CASES_MEDIA` —
 * the SAME media the CTA layer hides at; gate parity: a screen without
 * its arming CTA is dead weight) and assembles the scroll-owned band
 * getter:
 *
 *   arcBandFactor(paintProgress, epilogue) — Build-band rise ×
 *     epilogue kill (the ADR-033 exclusivity contract vs the services
 *     ring, carried over verbatim), ×
 *   (1 − smootherstep(0, 0.15, dissipate)) — the corridor-exit
 *     zoom-dissipate guard: the instant the exit dissipate engages the
 *     terrace is gone, long before the services ring enters.
 *
 * Mounted in `DepthGatewayScene/index.tsx` next to
 * `<SubstrateTopography/>` — the screen is a world-fixed landscape
 * object, NOT part of the pointer-look instrument (no armillary scale,
 * no cursor tilt).
 */

import { useEffect, useState } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { arcBandFactor } from "@/lib/arc-cases/terraceMath";
import { smootherstep } from "@/lib/services-ring/ringMath";
import { ARC_CASES_MEDIA } from "../arcCasesTerrace";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "../DepthGatewayScene/motionFollower";
import { ArcCasesTerraceScreen } from "./ArcCasesTerraceScreen";

function terraceBand(): number {
  const { paintProgress } = useDepthGatewayStore.getState().transform;
  const dissipateGuard = 1 - smootherstep(0, 0.15, getSmoothedDissipate());
  return arcBandFactor(paintProgress, getSmoothedEpilogueProgress()) * dissipateGuard;
}

export function ArcCasesTerraceGate() {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(ARC_CASES_MEDIA);
    const update = () => setCapable(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!capable) return null;
  return <ArcCasesTerraceScreen bandGetter={terraceBand} />;
}

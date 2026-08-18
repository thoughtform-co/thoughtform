"use client";

import {
  ViewCarrier,
  carrierLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaCarrier";

import type { IslVariantProps } from "./variants";

/**
 * 38 · COMPOUND CARRIER — **SHIPPED, AND THIS IS NOW A WINDOW ONTO IT** (ADR-070
 * U33, 2026-08-18).
 *
 * The whole drawing — its geometry, its derived course ladder, its ink-centring
 * corrections, its brief, its guards' arithmetic and its 47 lettered cells —
 * lives in `components/landing/home-v2/services/casefile/map/pda/PdaCarrier.tsx`
 * and is what reading 03 renders on the landing page. This file is the lab's
 * adapter: it re-exports that module wholesale so `substrate-lab-fit` keeps
 * walking the same symbols by the same names, and it maps the lab's `IslRecord`
 * onto the production drawing's props.
 *
 * ⚠ **THE DEPENDENCY RUNS LAB → PRODUCTION, NEVER THE OTHER WAY.** This tree is
 * `app/(internal)`, which `proxy.ts` blocks in production, so a shipped
 * component importing from here would be a route-gated module on a public page.
 * More to the point, the alternative — a copy in each place — is precisely the
 * defect ADR-069 U1 recorded one level down: two drawings that resemble each
 * other, each measured only against itself, quietly diverging until the object
 * changes shape between them.
 *
 * ⚠ **THE LAB MOUNTS IT WITH A STREAM SEATED**, because production does. The
 * hub is ADR-069's third flight home now, so the resting brief is only what the
 * reader sees before they have opened anything; a lab that always showed the
 * brief would be look-dev on a state the landing page mostly is not in.
 * `still` is set — there is no view change to arrive from here — and `entry` is
 * the plain raster for the same reason.
 */

export * from "@/components/landing/home-v2/services/casefile/map/pda/PdaCarrier";

export function VariantCarrier({ record }: IslVariantProps) {
  return (
    <ViewCarrier
      shapes={record.shapes}
      skills={record.skills ?? []}
      selected={record.selectedWork ?? null}
      still
      entry={{ kind: "raster" }}
    />
  );
}

/** ⚠ RE-EXPORTED UNDER ITS OLD NAME so the lab's own probes keep resolving. The
 *  layout is the production derivation; there is no lab copy of it. */
export { carrierLayout as islCarrierLayout };

"use client";

import {
  ESTATE_BLOCK_H,
  EstateBand,
  GalleryBand,
  estateBandY,
  galleryBandY,
} from "@/components/landing/home-v2/services/casefile/map/pda/estateBand";

import { VesselRig, vesselLettering } from "./vesselRig";
import { L, PAD, W, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 35 · MANIFOLD — the estate above, then the round-eight vessel rig with a
 * supply manifold drawn between them.
 *
 * ⚠ **THIS IS THE REGISTER COMPARISON, NOT THE FAVOURITE.** The plan
 * (`variants.ts`) states the trade explicitly: vessels cannot seat 47
 * legible plates at this crop, so the roster drops to graduation marks +
 * ledger. This is the direction that shows what SECTION's 47 plates cost
 * on the surface if they are removed.
 *
 * ## Composition
 *
 * The estate band + gallery block from `estateBand.tsx` sits above; the
 * round-eight vessel rig is shifted down by that block's own height so it
 * lands in the strata's space. Silhouette is the TAPERED VAT — the plainest
 * of the three round-eight shapes (`vats` in `variants.ts`), chosen as the
 * control: if the neck (flasks) and the hexagon (cells) both read as
 * costume, the plain vat is what is left.
 *
 * ⚠ NO CONDUCTORS. The vessel rig already has a manifold (`ribbonPaths`)
 * connecting the vessels; running per-stream conductors from the estate
 * footprints through that would put 51+ overlapping ribbons on a drawing
 * whose whole argument is a clean supply-side register. The selected
 * footprint above LIGHTS but does not drop a wire.
 */

export const MANIFOLD_VIEWBOX = "0 0 932 762";

/** How far the vessel rig shifts down to make room for the estate + gallery
 *  block. Chosen equal to the block itself so the vessels start where the
 *  gap after the gallery ends. */
const RIG_SHIFT = ESTATE_BLOCK_H;

export function VariantManifold({ record }: IslVariantProps) {
  const eY = estateBandY(PAD);
  const gY = galleryBandY(PAD);
  const selectedId = record.selectedWork?.id ?? null;

  return (
    <>
      <EstateBand
        works={record.works ?? []}
        y0={eY}
        bandLeft={L}
        bandWidth={W}
        selectedId={selectedId}
        still
      />
      <GalleryBand y0={gY} bandLeft={L} bandWidth={W} />

      {/* THE VESSEL RIG, shifted down by the estate block so its top clears
          the gallery. The rig draws in ABSOLUTE crop coordinates, so a
          simple translate is the right transform — the fit test walks its
          own lettering, which is unchanged. */}
      <g transform={`translate(0 ${RIG_SHIFT})`}>
        <VesselRig record={record} shape="vat" />
      </g>
    </>
  );
}

/** Every string the drawing letters — the vessel rig's own ledger, since
 *  the bands letter nothing at rest. */
export const manifoldLettering = (record: IslRecord): LetterSpec[] => vesselLettering(record);

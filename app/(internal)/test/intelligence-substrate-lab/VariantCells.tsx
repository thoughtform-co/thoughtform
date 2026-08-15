import { VesselRig } from "./vesselRig";
import type { IslVariantProps } from "./variants";

export {
  vesselLettering as cellLettering,
  vesselMarkCount as cellMarkCount,
  vesselMass as cellMass,
} from "./vesselRig";

/**
 * 31 · CELLS — the vessel rig at the "cell" silhouette.
 *
 * ⚠ ONE RIG, THREE OUTLINES, so the comparison is about the SHAPE and nothing
 * else — the same discipline `FormCard` used for density against field. The
 * composition, the ledger, the manifold, the graduation and the contents are
 * identical across 30–32; only `vesselPath` changes. See `vesselRig.tsx` for
 * why a chamfered rectangle is not available to this reading.
 */

export const CELLS_VIEWBOX = "0 0 932 762";

export function VariantCells({ record }: IslVariantProps) {
  return <VesselRig record={record} shape="cell" />;
}

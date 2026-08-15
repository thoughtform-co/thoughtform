import { VesselRig } from "./vesselRig";
import type { IslVariantProps } from "./variants";

export {
  vesselLettering as vatLettering,
  vesselMarkCount as vatMarkCount,
  vesselMass as vatMass,
} from "./vesselRig";

/**
 * 32 · VATS — the vessel rig at the "vat" silhouette.
 *
 * ⚠ ONE RIG, THREE OUTLINES, so the comparison is about the SHAPE and nothing
 * else — the same discipline `FormCard` used for density against field. The
 * composition, the ledger, the manifold, the graduation and the contents are
 * identical across 30–32; only `vesselPath` changes. See `vesselRig.tsx` for
 * why a chamfered rectangle is not available to this reading.
 */

export const VATS_VIEWBOX = "0 0 932 762";

export function VariantVats({ record }: IslVariantProps) {
  return <VesselRig record={record} shape="vat" />;
}

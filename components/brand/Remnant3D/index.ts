/**
 * Remnant3D — the Gateway key visual's coiled remnant structure as 3D geometry.
 *
 *     import { Remnant3D } from "@/components/brand/Remnant3D";
 *
 * Reconstructed from `public/images/Gateway_v1b.webp` via the img2threejs skill
 * (see `generated/README.md` for provenance) with the sweep geometry solved
 * against measurements taken off the artifact mask.
 *
 * See `/test/remnant-3d` for live tuning and the plate A/B overlay. Not wired
 * into any production surface — this is a lab asset.
 */

export { Remnant3D } from "./Remnant3D";
export type { Remnant3DProps } from "./Remnant3D";

export { buildRemnantRibbon, sampleRibbonFray, RIBBON_DEFAULTS } from "./buildRemnantRibbon";
export type { RibbonOptions, RibbonResult } from "./buildRemnantRibbon";

export {
  coilSpine,
  sparSpine,
  fullSpine,
  halfWidthAt,
  DEFAULT_SPINE_PARAMS,
  HALF_WIDTH,
  HALF_THICKNESS,
  R_INNER,
  R_OUTER,
  THETA_SPAN,
  TURNS,
} from "./remnantSpine";
export type { SpineParams } from "./remnantSpine";

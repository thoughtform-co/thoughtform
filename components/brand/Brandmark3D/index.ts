/**
 * Brandmark3D — public surface of the extruded-3D brandmark mesh.
 *
 *     import { Brandmark3D } from "@/components/brand/Brandmark3D";
 *
 * See `/test/brandmark-3d` for live tuning. Production integration
 * (corridor centre-mark replacement) is a follow-up plan, not yet
 * wired into `DepthGatewayScene`.
 */

export { Brandmark3D } from "./Brandmark3D";
export type {
  Brandmark3DProps,
  Brandmark3DMaterialMode,
  Brandmark3DPhysicalParams,
  Brandmark3DTransmissionParams,
  Brandmark3DWireframeParams,
  Brandmark3DCutawayParams,
} from "./Brandmark3D";

export { RoomEnvironmentRig } from "./EnvironmentRig";
export type { RoomEnvironmentRigProps } from "./EnvironmentRig";

export { ReflectiveEnvironmentRig } from "./ReflectiveEnvironmentRig";
export type { ReflectiveEnvironmentRigProps } from "./ReflectiveEnvironmentRig";

export { buildBrandmarkGeometry, DEFAULT_BRANDMARK_SVG_URL } from "./buildBrandmarkGeometry";
export type {
  BuildBrandmarkGeometryOptions,
  BuildBrandmarkGeometryResult,
} from "./buildBrandmarkGeometry";

export {
  makeMatcapTexture,
  makeGoldMatcap,
  DEFAULT_GOLD_MATCAP_STOPS,
  MATCAP_PRESETS,
} from "./makeGoldMatcap";
export type {
  GoldMatcapStops,
  MakeMatcapOptions,
  MakeGoldMatcapOptions,
  MatcapStyle,
  MatcapPreset,
  MatcapPresetName,
} from "./makeGoldMatcap";

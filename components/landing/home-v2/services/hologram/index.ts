/**
 * Services hologram — the volumetric brandmark centerpiece + 3D orbits for
 * the `#services` station. One shared perspective R3F scene (artifact + orbit
 * rings in the same camera). Prototyped in `/test/services-hologram`; promoted
 * into the Services stage once the look is locked.
 */

export {
  BRANDMARK_GLB,
  BRANDMARK_WIRE_GLB,
  VolumetricBrandmarkArtifact,
  type ContinuumBandDrive,
  type VolumetricBrandmarkBlending,
  type VolumetricBrandmarkArtifactProps,
} from "./VolumetricBrandmarkArtifact";
export {
  HologramOrbits,
  DEFAULT_ORBITS,
  type HologramOrbitsProps,
  type OrbitConfig,
} from "./HologramOrbits";
export { ServicesHologramScene, type ServicesHologramSceneProps } from "./ServicesHologramScene";
export { ServicesCardRing, type ServicesCardRingProps } from "./ServicesCardRing";

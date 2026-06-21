/**
 * Shared types + tunable defaults for the voxel media-block effect.
 *
 * A `VoxelMediaItem` is one block in the grid: a still image (always)
 * plus an optional looping video that plays only while the block is the
 * in-view / hovered one (perf rule — at most one video decoding at a time).
 */

export interface VoxelMediaItem {
  id: string;
  /** Short label rendered under / over the block. */
  label: string;
  /** Still image URL — also the video poster + the mobile/fallback paint. */
  image: string;
  /** Optional looping video URL; sampled into the voxel grid when active. */
  video?: string;
  /** Alt / aria text. */
  alt: string;
}

/**
 * Live-tunable knobs. Exposed as sliders in the lab route; frozen to the
 * defaults below once the look is locked for production.
 */
export interface VoxelConfig {
  /** Cubes along the longest media axis (drives grid resolution / "pixel" size). */
  resolution: number;
  /** Max Z displacement in world units (perlin relief height). */
  displaceHeight: number;
  /** UV scroll speed of the perlin field (reference uses ~0.05). */
  noiseSpeed: number;
  /** Perlin UV tiling scale across the block (reference uses ~0.75). */
  noiseScale: number;
  /** Cube scale-compression amount as it displaces (the "glitch" shimmer). */
  glitch: number;
  /** Fog density (exponential). */
  fogDensity: number;
  /** Directional light azimuth in radians. */
  lightAngle: number;
  /** Gap between cubes as a fraction of cell size (0 = touching, 1 = max gap). */
  gap: number;
}

export const DEFAULT_VOXEL_CONFIG: VoxelConfig = {
  resolution: 44,
  displaceHeight: 0.9,
  noiseSpeed: 0.05,
  noiseScale: 0.75,
  glitch: 0.6,
  fogDensity: 0.12,
  lightAngle: 0.7,
  gap: 0.12,
};

/** Warm palette pulled from the rogierdeboeve reference (ember + haze). */
export const VOXEL_PALETTE = {
  /** Scene fog + background haze base (deep ember brown). */
  fog: "#1a0f0a",
  /** Warm key light. */
  light: "#ffb27a",
  /** Cool ambient fill so shadowed cube faces don't go black. */
  ambient: "#3a2a3f",
  /** Fresnel rim accent (ember orange). */
  rim: "#ff6a2a",
} as const;

/** Mobile tier resolution cap (per ADR-011 density-tier discipline). */
export const MOBILE_RESOLUTION = 24;

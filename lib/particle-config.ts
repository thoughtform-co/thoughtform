// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM CONFIGURATION
// Types and defaults for the admin-controlled particle system
// ═══════════════════════════════════════════════════════════════

/**
 * Configuration for the main terrain/manifold
 */
export interface ManifoldConfig {
  /** Hex color for terrain particles (e.g., "#ebe3d6") */
  color: string;
  /** Number of rows in the terrain grid (affects density) */
  rows: number;
  /** Number of columns in the terrain grid */
  columns: number;
  /** Height/amplitude of the wave terrain (50-400) */
  waveAmplitude: number;
  /** Frequency/tightness of waves (0.05-0.5) */
  waveFrequency: number;
  /** Horizontal spread multiplier (0.5-2.0) */
  spreadX: number;
  /** Depth spread multiplier (0.5-2.0) */
  spreadZ: number;
  /** Opacity multiplier for terrain (0.1-1.0) */
  opacity: number;
}

/**
 * Available landmark shapes
 */
export type LandmarkShape = 'gateway' | 'tower' | 'helix' | 'sphere' | 'ring';

/**
 * Configuration for a section landmark
 */
export interface LandmarkConfig {
  /** Unique identifier */
  id: string;
  /** Matches data-section attribute in HTML */
  sectionId: string;
  /** Display name for admin panel */
  name: string;
  /** Shape type */
  shape: LandmarkShape;
  /** Hex color for landmark particles */
  color: string;
  /** Particle density/count multiplier (0.5-3.0) */
  density: number;
  /** Scale multiplier (0.5-2.0) */
  scale: number;
  /** Position offset from default */
  position: {
    x: number;
    y: number;
    z: number;
  };
  /** Whether this landmark is enabled */
  enabled: boolean;
}

/**
 * Complete particle system configuration
 */
export interface ParticleSystemConfig {
  manifold: ManifoldConfig;
  landmarks: LandmarkConfig[];
  /** Config version for migrations */
  version: number;
}

/**
 * Default manifold configuration
 */
export const DEFAULT_MANIFOLD: ManifoldConfig = {
  color: "#ebe3d6", // Dawn color
  rows: 140,
  columns: 60,
  waveAmplitude: 180,
  waveFrequency: 0.2,
  spreadX: 1.0,
  spreadZ: 1.0,
  opacity: 0.45, // Increased from 0.25 for better visibility
};

/**
 * Default landmark configurations
 */
export const DEFAULT_LANDMARKS: LandmarkConfig[] = [
  {
    id: "gateway",
    sectionId: "hero",
    name: "Gateway Portal",
    shape: "gateway",
    color: "#caa554", // Gold
    density: 1.0,
    scale: 1.0,
    position: { x: 150, y: 180, z: 800 },
    enabled: true,
  },
  {
    id: "tower",
    sectionId: "manifesto",
    name: "Crystalline Tower",
    shape: "tower",
    color: "#caa554", // Gold
    density: 1.0,
    scale: 1.0,
    position: { x: 0, y: 0, z: 3200 },
    enabled: true,
  },
  {
    id: "tunnel",
    sectionId: "services",
    name: "Trajectory Tunnel",
    shape: "helix",
    color: "#caa554", // Gold
    density: 1.0,
    scale: 1.0,
    position: { x: 0, y: 0, z: 5800 },
    enabled: true,
  },
  {
    id: "horizon",
    sectionId: "contact",
    name: "Event Horizon",
    shape: "sphere",
    color: "#ff6b35", // Alert orange
    density: 1.0,
    scale: 1.0,
    position: { x: 0, y: 0, z: 8800 },
    enabled: true,
  },
];

/**
 * Default complete configuration
 */
export const DEFAULT_CONFIG: ParticleSystemConfig = {
  manifold: DEFAULT_MANIFOLD,
  landmarks: DEFAULT_LANDMARKS,
  version: 1,
};

/**
 * Validate and merge partial config with defaults
 */
export function mergeWithDefaults(
  partial: Partial<ParticleSystemConfig>
): ParticleSystemConfig {
  return {
    manifold: {
      ...DEFAULT_MANIFOLD,
      ...(partial.manifold || {}),
    },
    landmarks: partial.landmarks?.length
      ? partial.landmarks
      : DEFAULT_LANDMARKS,
    version: partial.version || DEFAULT_CONFIG.version,
  };
}

/**
 * Convert hex color to RGB string for canvas operations
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "236, 227, 214"; // Default to dawn
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * Preset color options for the admin panel
 */
export const COLOR_PRESETS = {
  dawn: "#ebe3d6",
  gold: "#caa554",
  alert: "#ff6b35",
  teal: "#5b8a7a",
  void: "#050504",
};

/**
 * Shape display names
 */
export const SHAPE_LABELS: Record<LandmarkShape, string> = {
  gateway: "Circular Gateway",
  tower: "Crystalline Tower",
  helix: "Double Helix",
  sphere: "Sphere/Singularity",
  ring: "Concentric Rings",
};


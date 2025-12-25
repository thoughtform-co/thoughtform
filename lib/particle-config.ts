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
export type LandmarkShape =
  | "gateway"
  | "tower"
  | "helix"
  | "sphere"
  | "ring"
  | "ziggurat"
  | "lorenz"
  | "halvorsen"
  | "rossler"
  | "orbit"
  | "gridlines"
  | "contour"
  | "wireframeSphere"
  | "starfield";

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
 * Available gateway portal shapes
 * Geometric: 2D polygon outlines
 * Attractors: 3D mathematical chaos systems
 */
export type GatewayShape =
  // Geometric shapes (2D outlines)
  | "circle"
  | "hexagon"
  | "octagon"
  | "diamond"
  | "arch"
  | "ellipse"
  | "thoughtformGateway1"
  // Strange attractors (3D particle systems)
  | "lorenz"
  | "thomas"
  | "aizawa"
  | "sprott"
  | "rossler"
  | "dadras"
  | "galaxy"
  // Portal-like mathematical surfaces
  | "torus"
  | "hyperboloid"
  | "vortex"
  | "spiralTorus"
  | "mobius"
  | "hypersphere";

/**
 * Labels for gateway shapes (for admin panel)
 */
export const GATEWAY_SHAPE_LABELS: Record<GatewayShape, string> = {
  // Geometric
  circle: "Circle (Classic)",
  hexagon: "Hexagon",
  octagon: "Octagon",
  diamond: "Diamond",
  arch: "Arch / Doorway",
  ellipse: "Ellipse (Wide)",
  thoughtformGateway1: "Thoughtform Gateway I",
  // Strange Attractors
  lorenz: "Lorenz (Butterfly)",
  thomas: "Thomas (Symmetric)",
  aizawa: "Aizawa (Disc)",
  sprott: "Sprott (Spiral)",
  rossler: "Rössler (Fold)",
  dadras: "Dadras (Complex)",
  galaxy: "Galaxy (Spiral)",
  // Portal-like surfaces
  torus: "Torus (Donut Portal)",
  hyperboloid: "Hyperboloid (Hourglass)",
  vortex: "Vortex (Whirlpool)",
  spiralTorus: "Spiral Torus (Twisted Donut)",
  mobius: "Möbius (Twisted Portal)",
  hypersphere: "Hypersphere (4D Portal)",
};

/**
 * Whether a gateway shape is an attractor (3D) vs geometric (2D)
 */
export const GATEWAY_SHAPE_IS_ATTRACTOR: Record<GatewayShape, boolean> = {
  circle: false,
  hexagon: false,
  octagon: false,
  diamond: false,
  arch: false,
  ellipse: false,
  thoughtformGateway1: false,
  lorenz: true,
  thomas: true,
  aizawa: true,
  sprott: true,
  rossler: true,
  dadras: true,
  galaxy: true,
  torus: true,
  hyperboloid: true,
  vortex: true,
  spiralTorus: true,
  mobius: true,
  hypersphere: true,
};

/**
 * Configuration for the Three.js Gateway (hero section)
 */
export interface GatewayConfig {
  /** Whether the gateway is visible */
  enabled: boolean;
  /** Shape of the gateway portal */
  shape: GatewayShape;
  /** Primary color for the portal ring */
  primaryColor: string;
  /** Accent/gold color for inner details */
  accentColor: string;
  /** Overall scale multiplier (0.5-3.0) */
  scale: number;
  /** Horizontal position offset (-3 to 3) */
  positionX: number;
  /** Vertical position offset (-2 to 2) */
  positionY: number;
  /** Particle density multiplier (0.3-2.0) */
  density: number;
  /** Tunnel depth multiplier (0.5-2.0) */
  tunnelDepth: number;
  /** Rotation of the gateway ring on Y-axis in radians (faces the portal) */
  rotationY: number;
  /** Tunnel curvature - bends the tunnel path (-1 to 1) */
  tunnelCurve: number;
  /** Tunnel width multiplier (0.5-2.0) */
  tunnelWidth: number;
  /** Enable algorithmic effects / latent space field around gateway */
  algorithmicEffects: boolean;
  /** Intensity of algorithmic effects (0.0-2.0) */
  algorithmicIntensity: number;
  /** Pattern type for algorithmic effects */
  algorithmicPattern: "spiral" | "lissajous" | "fieldLines" | "particleStreams" | "all";
}

/**
 * Configuration for the Thoughtform Sigil (brandmark)
 */
export interface SigilConfig {
  /** Whether the sigil is visible */
  enabled: boolean;
  /** Size of the sigil in pixels (100-400) */
  size: number;
  /** Number of particles (100-800) */
  particleCount: number;
  /** Base particle size multiplier (0.5-3.0) */
  particleSize: number;
  /** Base opacity multiplier (0.3-1.0) */
  opacity: number;
  /** Wander/motion strength (0-2.0) - how much particles move around */
  wanderStrength: number;
  /** Pulse/breathing speed multiplier (0.5-3.0) */
  pulseSpeed: number;
  /** Return force strength (0.5-3.0) - how strongly particles return to position */
  returnStrength: number;
  /** Color in RGB format (e.g., "202, 165, 84") */
  color: string;
}

/**
 * Configuration for camera/projection settings
 */
export interface CameraConfig {
  /** Focal length - affects perspective strength (100-1000, lower = more perspective) */
  focalLength: number;
  /** Horizontal vanishing point position (0-1, percentage of screen width) */
  vanishX: number;
  /** Vertical vanishing point position (0-1, percentage of screen height) */
  vanishY: number;
  /** Pitch angle - vertical tilt in degrees (0 = horizon, higher = more top-down) */
  pitch: number;
  /** Yaw angle - horizontal rotation in degrees */
  yaw: number;
  /** Roll angle - frontal tilt/rotation in degrees (tilts the whole view like tilting your head) */
  roll: number;
  /** Truck X - horizontal camera position offset (moves entire view left/right) */
  truckX: number;
  /** Truck Y - vertical camera position offset (moves entire view up/down) */
  truckY: number;
  /** Clip terrain above this screen percentage (0 = no clip, 0.35 = default) */
  terrainClipY: number;
  /** Optional max render depth (world Z). Higher = deeper vistas, more particles. */
  maxDepth?: number;
}

/**
 * Complete particle system configuration
 */
export interface ParticleSystemConfig {
  manifold: ManifoldConfig;
  landmarks: LandmarkConfig[];
  gateway: GatewayConfig;
  camera: CameraConfig;
  sigil: SigilConfig;
  /** Config version for migrations */
  version: number;
}

/**
 * Default manifold configuration
 * Subdued, atmospheric grid that integrates with the background
 * Inspired by Dragonfly.xyz's low-contrast particle approach
 */
export const DEFAULT_MANIFOLD: ManifoldConfig = {
  color: "#3a3832", // Muted warm gray - barely visible, atmospheric
  rows: 140,
  columns: 60,
  waveAmplitude: 180,
  waveFrequency: 0.2,
  spreadX: 1.0,
  spreadZ: 1.0,
  opacity: 0.35, // Lower opacity for subtle background texture
};

/**
 * Default landmark configurations
 * Colors are muted to integrate with background - use accent colors sparingly
 * for elements that should "pop" above the atmospheric grid
 */
export const DEFAULT_LANDMARKS: LandmarkConfig[] = [
  {
    id: "gateway",
    sectionId: "hero",
    name: "Gateway Portal",
    shape: "gateway",
    color: "#6b6355", // Muted warm gray (was gold)
    density: 1.0,
    scale: 1.0,
    position: { x: 150, y: 180, z: 800 },
    enabled: false, // Disabled - using Three.js gateway instead
  },
  {
    id: "lorenz",
    sectionId: "definition",
    name: "Lorenz Attractor",
    shape: "lorenz",
    color: "#caa554", // BRIGHT GOLD - this landmark should POP above the grid
    density: 1.5,
    scale: 1.2,
    position: { x: 0, y: 0, z: 2400 }, // Floating above the manifold
    enabled: true,
  },
  {
    id: "tower",
    sectionId: "manifesto",
    name: "Crystalline Tower",
    shape: "tower",
    color: "#5a5548", // Muted warm gray
    density: 1.0,
    scale: 1.0,
    position: { x: 0, y: 0, z: 3200 },
    enabled: false, // Disabled - manifesto uses glassmorphism text panel instead
  },
  {
    id: "tunnel",
    sectionId: "services",
    name: "Trajectory Tunnel",
    shape: "helix",
    color: "#5a5548", // Muted warm gray - integrates with grid
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
    color: "#6b4a3a", // Muted warm brown (was alert orange)
    density: 1.0,
    scale: 1.0,
    position: { x: 0, y: 0, z: 8800 },
    enabled: true,
  },
];

/**
 * Default gateway configuration
 * Solid, iconic portal that invites you to travel through
 * Higher density and brighter colors for architectural presence
 */
export const DEFAULT_GATEWAY: GatewayConfig = {
  enabled: true,
  shape: "circle", // Classic circular portal
  primaryColor: "#d4ccc0", // Bright dawn - solid, visible structure
  accentColor: "#caa554", // Full gold accent - highlights pop
  scale: 2.2,
  positionX: -1.3, // Right side of screen (Three.js coords)
  positionY: 0.15,
  density: 1.5, // Higher density for solid appearance
  tunnelDepth: 1.2, // Deeper tunnel for travel invitation
  rotationY: -0.5, // Gateway ring facing inward
  tunnelCurve: 0, // Straight tunnel (negative = curves left, positive = curves right)
  tunnelWidth: 1.0, // Default width
  algorithmicEffects: false, // Disabled by default
  algorithmicIntensity: 1.0, // Default intensity
  algorithmicPattern: "all", // Use all patterns combined
};

/**
 * Default camera configuration
 */
export const DEFAULT_CAMERA: CameraConfig = {
  focalLength: 400,
  vanishX: 0.5, // Centered vanishing point - straight ahead navigation
  vanishY: 0.5, // Center vertically
  pitch: 0, // No pitch (horizon view, current behavior)
  yaw: 0, // No yaw rotation
  roll: 0, // No roll (frontal tilt)
  truckX: 0, // No horizontal camera offset
  truckY: 0, // No vertical camera offset
  terrainClipY: 0.35, // Clip terrain above 35% of screen (current behavior)
};

/**
 * Default sigil configuration
 */
export const DEFAULT_SIGIL: SigilConfig = {
  enabled: true,
  size: 220,
  particleCount: 500,
  particleSize: 1.0,
  opacity: 1.0,
  wanderStrength: 1.0,
  pulseSpeed: 1.0,
  returnStrength: 1.0,
  color: "202, 165, 84", // Tensor Gold RGB
};

/**
 * Default complete configuration
 */
export const DEFAULT_CONFIG: ParticleSystemConfig = {
  manifold: DEFAULT_MANIFOLD,
  landmarks: DEFAULT_LANDMARKS,
  gateway: DEFAULT_GATEWAY,
  camera: DEFAULT_CAMERA,
  sigil: DEFAULT_SIGIL,
  version: 4, // Bumped version for sigil config
};

/**
 * Validate and merge partial config with defaults
 */
export function mergeWithDefaults(partial: Partial<ParticleSystemConfig>): ParticleSystemConfig {
  return {
    manifold: {
      ...DEFAULT_MANIFOLD,
      ...(partial.manifold || {}),
    },
    landmarks: partial.landmarks?.length ? partial.landmarks : DEFAULT_LANDMARKS,
    gateway: {
      ...DEFAULT_GATEWAY,
      ...(partial.gateway || {}),
    },
    camera: {
      ...DEFAULT_CAMERA,
      ...(partial.camera || {}),
    },
    sigil: {
      ...DEFAULT_SIGIL,
      ...(partial.sigil || {}),
    },
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
 *
 * DESIGN PHILOSOPHY (inspired by Dragonfly.xyz):
 * - Use MUTED colors for the particle grid to create atmospheric depth
 * - Reserve ACCENT colors for UI elements that should "pop" above the grid
 * - The grid should integrate with the background, not compete with content
 */
export const COLOR_PRESETS = {
  // Thoughtform brand colors only
  "Semantic Dawn": "#ebe3d6", // Primary light color - structure/text
  "Tensor Gold": "#caa554", // Accent gold - highlights
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
  ziggurat: "Ziggurat/Tree",
  lorenz: "Lorenz Attractor",
  halvorsen: "Halvorsen Attractor",
  rossler: "Rössler Attractor",
  orbit: "Orbital Path",
  gridlines: "Grid Lines",
  contour: "Contour Topology",
  wireframeSphere: "Wireframe Sphere",
  starfield: "Starfield",
};

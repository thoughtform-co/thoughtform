// ═══════════════════════════════════════════════════════════════════
// UI TYPES - Shared styling and layout types
// ═══════════════════════════════════════════════════════════════════

export interface SpacingConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutMode = "absolute" | "flow";

export type AlignmentType = "left" | "center" | "right" | "top" | "middle" | "bottom";

export type DistributeDirection = "horizontal" | "vertical";

// Background Types
export type BackgroundType = "none" | "image" | "video" | "animation";

// All animation presets (2D canvas + 3D Three.js unified)
export type AnimationPreset =
  // Featured
  | "gateway-cardinal" // Gateway with Halvorsen flow (default)
  | "gateway" // Gateway torus with terrain
  // 2D Canvas
  | "torus" // Rotating geometric ring
  | "attractor" // Chaotic motion lines
  | "wave" // Flowing wave patterns
  // 3D Three.js
  | "starfield" // Rotating star sphere
  | "particles" // Wave-motion particles
  | "geometric" // Wireframe torus points
  | "nebula" // Colorful particle cloud
  | "grid" // Rolling wave grid
  | "spiral" // DNA double helix
  | "vortex" // Swirling tunnel
  | "custom"; // Custom code

export interface BackgroundConfig {
  type: BackgroundType;
  // Image background
  imageUrl?: string;
  imagePosition?: "cover" | "contain" | "center";
  imageOpacity?: number;
  // Video background
  videoUrl?: string;
  videoOpacity?: number;
  videoMuted?: boolean;
  videoLoop?: boolean;
  // Animation background (unified 2D/3D)
  animationPreset?: AnimationPreset;
  animationOpacity?: number;
  // Custom animation code
  customCode?: string;
}

// Grid size type (constant defined in @/constants/grid)
export type GridSize = 8 | 16 | 24 | 32;

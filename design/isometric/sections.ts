export type IsometricSectionId = "system_online" | "orbital_scan" | "target_acquired" | "deep_core";

export type IsometricSection = {
  id: IsometricSectionId;
  label: string;
  sublabel: string;
  /**
   * Normalized scroll range within the page (0..1).
   * Larger ranges = slower travel through that segment.
   */
  range: readonly [start: number, end: number];
  /**
   * Scene rotation in radians (Y-axis orbit around center).
   * Allows 90° rotation during scroll like Gemini reference.
   */
  rotationY: number;
  /**
   * Camera height / vertical position.
   * Higher = bird's eye, lower = ground-level close-up.
   */
  cameraY: number;
  /** Orthographic zoom at this section (higher = closer). */
  zoom: number;
  /** Z travel position (depth into the terrain). */
  travelZ: number;
};

/**
 * Scroll-aligned fly-through path for the isometric manifold mockup.
 * Inspired by Gemini's scroll journey: zoom in → rotate 90° → drop camera → close-up.
 */
export const ISOMETRIC_SECTIONS: readonly IsometricSection[] = [
  {
    id: "system_online",
    label: "SYSTEM ONLINE",
    sublabel: "SECTOR 7G // WIDE VIEW",
    range: [0, 0.25],
    rotationY: 0,
    cameraY: 20,
    zoom: 1.0,
    travelZ: 1200,
  },
  {
    id: "orbital_scan",
    label: "ORBITAL SCAN",
    sublabel: "ROTATING 90°",
    range: [0.25, 0.55],
    rotationY: Math.PI / 2, // 90° rotation
    cameraY: 18,
    zoom: 1.8,
    travelZ: 3500,
  },
  {
    id: "target_acquired",
    label: "TARGET ACQUIRED",
    sublabel: "CITY CORE F01 // ZOOM 4X",
    range: [0.55, 0.85],
    rotationY: Math.PI / 2,
    cameraY: 8,
    zoom: 3.2,
    travelZ: 5200,
  },
  {
    id: "deep_core",
    label: "DEEP CORE",
    sublabel: "ARTIFACT LOCK // MAXIMUM DETAIL",
    range: [0.85, 1],
    rotationY: Math.PI / 2,
    cameraY: 5,
    zoom: 4.0,
    travelZ: 5200,
  },
] as const;

export type IsometricSectionId =
  | "overview"
  | "city_f01"
  | "ridge_west"
  | "basin_south"
  | "farfield_east";

export type IsometricSection = {
  id: IsometricSectionId;
  label: string;
  /**
   * Normalized scroll range within the page (0..1).
   * Larger ranges = slower travel through that segment.
   */
  range: readonly [start: number, end: number];
  /**
   * Camera focus target within the isometric map (world units).
   * The camera stays at a fixed isometric offset and looks at this target.
   */
  target: readonly [x: number, y: number, z: number];
  /** Orthographic zoom at this section (higher = closer). */
  zoom: number;
};

/**
 * Scroll-aligned fly-through path for the isometric manifold mockup.
 * Edit ranges + targets to tune section alignment and travel speed.
 */
export const ISOMETRIC_SECTIONS: readonly IsometricSection[] = [
  {
    id: "overview",
    label: "Overview",
    range: [0, 0.25],
    target: [0, -2, 0],
    zoom: 9,
  },
  {
    id: "city_f01",
    label: "City F01",
    range: [0.25, 0.5],
    target: [0, -2, 0],
    zoom: 12,
  },
  {
    id: "ridge_west",
    label: "Ridge West",
    range: [0.5, 0.75],
    target: [-22, -2, -12],
    zoom: 11,
  },
  {
    id: "basin_south",
    label: "Basin South",
    range: [0.75, 1],
    target: [10, -2, 18],
    zoom: 10.5,
  },
  {
    id: "farfield_east",
    label: "Farfield East",
    range: [1, 1],
    target: [28, -2, -6],
    zoom: 10,
  },
] as const;

/**
 * Flat 2D marks on a 24-unit grid, drawn at the same stroke as the isometric
 * line work so the flat and the 3D pieces read as one language. Square
 * terminals only: no circles, no rounded caps.
 */

export type GlyphId =
  | "production"
  | "ops"
  | "review"
  | "strategy"
  | "shopify"
  | "analytics"
  | "claude";

const D: Record<GlyphId, string> = {
  /* a frame with crop marks around one asset */
  production: "M2 7 V2 H7 M17 2 H22 V7 M22 17 V22 H17 M7 22 H2 V17 M7 8 H17 V16 H7 Z",
  /* a pipeline: three runs, one node lit at a handover */
  ops: "M2 6 H14 M18 6 H22 M2 12 H8 M12 12 H22 M2 18 H16 M20 18 H22 M14 4 H18 V8 H14 Z M8 10 H12 V14 H8 Z M16 16 H20 V20 H16 Z",
  /* a sheet under a scan line, with a pass mark */
  review: "M5 2 H19 V22 H5 Z M2 11 H22 M8 6 H16 M8 16 H13 M14 17 L16 19 L20 14",
  /* a route between three fixes */
  strategy:
    "M3 19 L10 12 L15 15 L21 5 M2 18 H5 V21 H2 Z M9 11 H12 V14 H9 Z M14 14 H17 V17 H14 Z M20 3 H23 V6 H20 Z",
  /* a carrier bag with a squared handle */
  shopify: "M4 8 H20 L19 22 H5 Z M9 8 V4 H15 V8",
  /* three bars on a baseline */
  analytics: "M2 22 H22 M5 22 V14 H9 V22 M11 22 V9 H15 V22 M17 22 V4 H21 V22",
  /* a housing with a slot */
  claude: "M2 4 H22 V20 H2 Z M6 10 H18 V14 H6 Z",
};

export function Glyph({
  id,
  x = 0,
  y = 0,
  size = 24,
  className = "hy-glyph",
}: {
  id: GlyphId;
  x?: number;
  y?: number;
  size?: number;
  className?: string;
}) {
  const k = size / 24;
  return (
    <path
      d={D[id]}
      className={className}
      transform={`translate(${x} ${y}) scale(${k})`}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export const WORKSTREAM_GLYPH: Record<string, GlyphId> = {
  production: "production",
  ops: "ops",
  review: "review",
  strategy: "strategy",
};

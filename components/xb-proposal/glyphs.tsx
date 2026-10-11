/* Flat line glyphs on a 24-unit grid, straight segments only. The same
   paths are drawn upright in a schematic and laid onto an isometric plane
   with `Iso.plane`, so the flat and the 3D pieces share one stroke. */

export type GlyphName = "production" | "ops" | "review" | "strategy" | "shopify" | "analytics";

export const GLYPH: Record<GlyphName, string> = {
  // A frame with a horizon: what gets made.
  production: "M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 5 M15 7h3v3h-3z",
  // A queue of jobs, each with its box.
  ops: "M3 4h4v4H3z M10 6h11 M3 10h4v4H3z M10 12h11 M3 16h4v4H3z M10 18h7",
  // A frame with a check.
  review: "M3 4h18v16H3z M7 12.5l3.5 3.5L17 9",
  // A route through decision points.
  strategy: "M3 19l6-7 4 3 8-9 M3 18h2v2H3z M8 11h2v2H8z M12 14h2v2h-2z M19 5h2v2h-2z",
  // A bag.
  shopify: "M4 8h16l-1.5 12h-13z M9 8V4h6v4",
  // Bars on a base line.
  analytics: "M3 20h18 M6 20v-6 M11 20V8 M16 20v-9",
};

interface GlyphProps {
  name: GlyphName;
  /** Rendered size in px when upright. */
  size?: number;
  x?: number;
  y?: number;
  /** Replaces the upright placement, e.g. an `Iso.plane` matrix. */
  transform?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function Glyph({
  name,
  size = 24,
  x = 0,
  y = 0,
  transform,
  stroke = "currentColor",
  strokeWidth = 1.25,
}: GlyphProps) {
  const k = size / 24;
  return (
    <path
      d={GLYPH[name]}
      transform={transform ?? `translate(${x} ${y}) scale(${k})`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  );
}

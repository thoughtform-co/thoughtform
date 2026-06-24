interface RadialSpokesProps {
  /** Number of evenly-spaced spokes around the circle. */
  count?: number;
  /** Inner radius where each spoke begins (a gap around the centre). */
  inner?: number;
  /** Spoke length (outer end = inner + length). */
  length?: number;
  /** SVG dash pattern; omit for a solid spoke. */
  dash?: string;
  /** Draw an outward-pointing chevron arrowhead at the spoke tip (fig. E field). */
  arrow?: boolean;
  /** Phase offset in degrees (rotates the whole fan). */
  rotate?: number;
  strokeWidth?: number;
  opacity?: number;
  /** Stroke colour token. Default gold. */
  stroke?: string;
}

/**
 * RadialSpokes — N evenly-spaced radial lines emanating from the centre, with an
 * optional outward arrowhead. Generalises the fixed 3-spoke `CompassRose` into a
 * parametric field — the radiating dashed arrows of the "fig. E" emblem, or a
 * clean sunburst for an astral talisman.
 */
export function RadialSpokes({
  count = 8,
  inner = 18,
  length = 70,
  dash,
  arrow = false,
  rotate = 0,
  strokeWidth = 0.6,
  opacity = 0.5,
  stroke = "var(--gold)",
}: RadialSpokesProps) {
  const outer = inner + length;
  const wing = 4; // arrowhead half-width
  const back = 6; // arrowhead depth
  return (
    <g stroke={stroke} strokeOpacity={opacity} strokeWidth={strokeWidth} fill="none">
      {Array.from({ length: count }, (_, i) => {
        const angle = rotate + i * (360 / count);
        return (
          <g key={i} transform={`rotate(${angle})`}>
            <path d={`M0 ${-inner} L0 ${-outer}`} strokeDasharray={dash} />
            {arrow && (
              <path d={`M${-wing} ${-(outer - back)} L0 ${-outer} L${wing} ${-(outer - back)}`} />
            )}
          </g>
        );
      })}
    </g>
  );
}

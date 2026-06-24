interface PlanetBodyProps {
  /** Planet disc radius. */
  radius?: number;
  /** Ring plane tilt in degrees. */
  ringTilt?: number;
  /** Show the Saturn-style ring. */
  ring?: boolean;
  /** Draw a thin crescent terminator across the disc. */
  crescent?: boolean;
}

/**
 * PlanetBody — a central ringed planet for symbolic emblems (the literal Saturn
 * of the "fig. E" reference). The ring is an ellipse pair drawn behind the disc,
 * with its near (front) arc redrawn over the disc so the ring reads as passing
 * around the body. `Reticle` covers the abstract centre; this covers the
 * pictorial one.
 */
export function PlanetBody({
  radius = 16,
  ringTilt = -18,
  ring = true,
  crescent = true,
}: PlanetBodyProps) {
  const rx = radius * 2.15;
  const ry = radius * 0.62;
  const rxInner = radius * 1.7;
  const ryInner = radius * 0.49;

  return (
    <>
      {/* Ring — full ellipses behind the disc. */}
      {ring && (
        <g transform={`rotate(${ringTilt})`} fill="none" stroke="var(--gold)">
          <ellipse cx={0} cy={0} rx={rx} ry={ry} strokeOpacity={0.5} strokeWidth={0.7} />
          <ellipse cx={0} cy={0} rx={rxInner} ry={ryInner} strokeOpacity={0.3} strokeWidth={0.5} />
        </g>
      )}

      {/* Planet disc. */}
      <circle r={radius} fill="var(--void)" stroke="var(--gold)" strokeWidth={0.8} />
      {crescent && (
        <path
          d={`M0 ${-radius} A ${radius * 0.55} ${radius} 0 0 0 0 ${radius} A ${radius} ${radius} 0 0 1 0 ${-radius} Z`}
          fill="var(--gold)"
          fillOpacity={0.12}
        />
      )}

      {/* Ring — near (front) arc redrawn over the disc. */}
      {ring && (
        <g transform={`rotate(${ringTilt})`} fill="none" stroke="var(--gold)">
          <path d={`M${-rx} 0 A ${rx} ${ry} 0 0 0 ${rx} 0`} strokeOpacity={0.6} strokeWidth={0.8} />
        </g>
      )}
    </>
  );
}

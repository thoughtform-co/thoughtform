import type { EclipticConfig } from "@/lib/celestial/schema";
import { seededRandom } from "./seededRandom";

interface EclipticArcProps {
  config: EclipticConfig;
}

/**
 * Tilted elliptical arc — the path of a planetary transit.
 * Phase markers (filled diamond + open circle) ride on the arc.
 */
export function EclipticArc({ config }: EclipticArcProps) {
  const { seed, tilt, phaseCount } = config;
  const rng = seededRandom(seed);
  const rx = 75 + rng() * 25;
  const ry = 30 + rng() * 20;
  const adjustedTilt = tilt + (rng() - 0.5) * 12;

  // Parametric points along the ellipse
  const point = (t: number) => ({
    x: rx * Math.cos(t),
    y: ry * Math.sin(t),
  });

  // Arc sweep: ~180-270 degrees
  const arcStart = -Math.PI * 0.7;
  const arcEnd = Math.PI * 0.6;

  const p0 = point(arcStart);
  const p1 = point(arcEnd);

  // Phase markers at parametric positions
  const markers: Array<{ x: number; y: number; type: "diamond" | "circle" }> = [];
  const phasePositions = phaseCount === 2 ? [0.3, 0.7] : [0.5];
  phasePositions.forEach((frac, i) => {
    const t = arcStart + (arcEnd - arcStart) * frac;
    const p = point(t);
    markers.push({ ...p, type: i % 2 === 0 ? "diamond" : "circle" });
  });

  return (
    <g transform={`rotate(${adjustedTilt})`}>
      {/* Main arc */}
      <ellipse
        cx="0"
        cy="0"
        rx={rx}
        ry={ry}
        stroke="var(--gold)"
        strokeOpacity="0.25"
        strokeWidth="0.7"
        strokeDasharray="4 3"
        fill="none"
      />

      {/* Extension lines past arc endpoints */}
      <line
        x1={p0.x}
        y1={p0.y}
        x2={p0.x * 1.2}
        y2={p0.y * 1.2}
        stroke="var(--dawn-20)"
        strokeWidth="0.4"
        strokeDasharray="2 4"
      />
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p1.x * 1.2}
        y2={p1.y * 1.2}
        stroke="var(--dawn-20)"
        strokeWidth="0.4"
        strokeDasharray="2 4"
      />

      {/* Phase markers */}
      {markers.map((m, i) =>
        m.type === "diamond" ? (
          <rect
            key={i}
            x={m.x - 3}
            y={m.y - 3}
            width={6}
            height={6}
            fill="var(--gold)"
            fillOpacity="0.8"
            transform={`rotate(45 ${m.x} ${m.y})`}
          />
        ) : (
          <circle
            key={i}
            cx={m.x}
            cy={m.y}
            r={3}
            stroke="var(--gold)"
            strokeOpacity="0.6"
            strokeWidth="0.7"
            fill="none"
          />
        )
      )}
    </g>
  );
}

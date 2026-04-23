import type { ArmatureConfig } from "@/lib/celestial/schema";
import { seededRandom } from "./seededRandom";

interface ArmatureProps {
  config: ArmatureConfig;
}

/**
 * Structural scaffolding with diamond joints — the "build" symbol.
 * Horizontal crossbars + 2 vertical rules, with gold diamond markers
 * at deterministic intersections. Mondrian meets technical drafting.
 */
export function Armature({ config }: ArmatureProps) {
  const { seed, crossbars, diamondJoints } = config;
  const rng = seededRandom(seed);

  const extent = 55;
  const vertX = [-38, 38];

  const hBars: number[] = [];
  for (let i = 0; i < crossbars; i++) {
    const t = (i + 0.5) / crossbars;
    const y = -extent + t * extent * 2 + (rng() - 0.5) * 12;
    hBars.push(Math.round(y * 10) / 10);
  }

  // Collect all intersection points
  const intersections: Array<{ x: number; y: number }> = [];
  for (const y of hBars) {
    for (const x of vertX) {
      intersections.push({ x, y });
    }
  }

  // Pick N diamond joints from intersections, deterministic
  const jointSet = new Set<number>();
  const target = Math.min(diamondJoints, intersections.length);
  while (jointSet.size < target) {
    jointSet.add(Math.floor(rng() * intersections.length));
  }

  const ds = 4;

  return (
    <g>
      {/* Vertical rules */}
      {vertX.map((x) => (
        <line
          key={`v${x}`}
          x1={x}
          y1={-extent}
          x2={x}
          y2={extent}
          stroke="var(--dawn-30, rgba(236,227,214,0.3))"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />
      ))}

      {/* Horizontal crossbars */}
      {hBars.map((y, i) => (
        <line
          key={`h${i}`}
          x1={-extent}
          y1={y}
          x2={extent}
          y2={y}
          stroke="var(--gold)"
          strokeOpacity="0.5"
          strokeWidth="0.6"
        />
      ))}

      {/* Intersection tick marks (non-joint) */}
      {intersections.map((pt, i) =>
        jointSet.has(i) ? null : (
          <line
            key={`t${i}`}
            x1={pt.x}
            y1={pt.y - 3}
            x2={pt.x}
            y2={pt.y + 3}
            stroke="var(--gold)"
            strokeOpacity="0.35"
            strokeWidth="0.5"
          />
        )
      )}

      {/* Diamond joints */}
      {Array.from(jointSet).map((idx) => {
        const pt = intersections[idx];
        return (
          <rect
            key={`j${idx}`}
            x={pt.x - ds}
            y={pt.y - ds}
            width={ds * 2}
            height={ds * 2}
            fill="var(--gold)"
            fillOpacity="0.85"
            transform={`rotate(45 ${pt.x} ${pt.y})`}
          />
        );
      })}

      {/* Terminal endcaps on verticals */}
      {vertX.map((x) => (
        <g key={`cap${x}`}>
          <line
            x1={x - 4}
            y1={-extent}
            x2={x + 4}
            y2={-extent}
            stroke="var(--gold)"
            strokeOpacity="0.6"
            strokeWidth="0.6"
          />
          <line
            x1={x - 4}
            y1={extent}
            x2={x + 4}
            y2={extent}
            stroke="var(--gold)"
            strokeOpacity="0.6"
            strokeWidth="0.6"
          />
        </g>
      ))}
    </g>
  );
}

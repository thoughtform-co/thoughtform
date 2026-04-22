import type { ConstellationConfig } from "@/lib/celestial/schema";
import { seededRandom } from "./seededRandom";

interface ConstellationProps {
  config: ConstellationConfig;
}

/**
 * Star chart — scattered points connected by faint asterism lines.
 * Each vertex is a tiny 4-point starburst. Deterministic from seed.
 */
export function Constellation({ config }: ConstellationProps) {
  const { seed, points, density } = config;
  const rng = seededRandom(seed);
  const spread = density === "dense" ? 70 : 90;
  const count = points;

  const stars: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (rng() - 0.5) * spread * 2,
      y: (rng() - 0.5) * spread * 2,
    });
  }

  // Nearest-neighbor chain to build asterism lines
  const visited = new Set<number>();
  const edges: Array<[number, number]> = [];
  let current = 0;
  visited.add(0);
  while (visited.size < stars.length) {
    let nearest = -1;
    let nearestDist = Infinity;
    for (let j = 0; j < stars.length; j++) {
      if (visited.has(j)) continue;
      const dx = stars[current].x - stars[j].x;
      const dy = stars[current].y - stars[j].y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = j;
      }
    }
    if (nearest < 0) break;
    edges.push([current, nearest]);
    visited.add(nearest);
    current = nearest;
  }

  // One extra random cross-link for visual interest
  if (stars.length > 4) {
    const a = Math.floor(rng() * stars.length);
    const b = Math.floor(rng() * stars.length);
    if (a !== b) edges.push([a, b]);
  }

  const starburstSize = 3.5;

  return (
    <g>
      {/* asterism lines */}
      {edges.map(([a, b], i) => (
        <line
          key={`e${i}`}
          x1={stars[a].x}
          y1={stars[a].y}
          x2={stars[b].x}
          y2={stars[b].y}
          stroke="var(--gold)"
          strokeOpacity="0.18"
          strokeWidth="0.5"
        />
      ))}
      {/* star vertices */}
      {stars.map((s, i) => {
        const size = starburstSize * (0.6 + rng() * 0.6);
        return (
          <g key={`s${i}`} transform={`translate(${s.x},${s.y})`}>
            <line
              x1={-size}
              y1="0"
              x2={size}
              y2="0"
              stroke="var(--gold)"
              strokeOpacity="0.7"
              strokeWidth="0.6"
            />
            <line
              x1="0"
              y1={-size}
              x2="0"
              y2={size}
              stroke="var(--gold)"
              strokeOpacity="0.7"
              strokeWidth="0.6"
            />
            <circle r="1" fill="var(--gold)" fillOpacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

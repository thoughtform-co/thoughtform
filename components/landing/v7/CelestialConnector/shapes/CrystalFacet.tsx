import type { CrystalConfig } from "@/lib/celestial/schema";

interface CrystalFacetProps {
  config: CrystalConfig;
}

/**
 * Faceted diamond/hex crystal — the "crystallized skill" symbol.
 * Outer N-gon + rotated inner N-gon connected by faceting lines.
 * On-brand: sharp geometry, diamonds not circles, zero border-radius.
 */
export function CrystalFacet({ config }: CrystalFacetProps) {
  const { facets, inset } = config;
  const outerR = 45;
  const innerR = outerR * Math.max(0.2, Math.min(inset, 0.9));
  const halfStep = Math.PI / facets;

  const outerPts = polygonPoints(facets, outerR, -Math.PI / 2);
  const innerPts = polygonPoints(facets, innerR, -Math.PI / 2 + halfStep);

  const outerPath = pointsToPath(outerPts);
  const innerPath = pointsToPath(innerPts);

  return (
    <g>
      {/* Inner facet fill */}
      <path d={innerPath} fill="var(--gold-15, rgba(202,165,84,0.15))" stroke="none" />

      {/* Faceting lines: each outer vertex → its two nearest inner vertices */}
      {outerPts.map((op, i) => {
        const a = innerPts[i];
        const b = innerPts[(i + facets - 1) % facets];
        return (
          <g key={`f${i}`}>
            <line
              x1={op.x}
              y1={op.y}
              x2={a.x}
              y2={a.y}
              stroke="var(--gold)"
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
            <line
              x1={op.x}
              y1={op.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--gold)"
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* Outer frame */}
      <path d={outerPath} fill="none" stroke="var(--gold)" strokeOpacity="0.6" strokeWidth="0.7" />

      {/* Inner frame */}
      <path d={innerPath} fill="none" stroke="var(--gold)" strokeOpacity="0.5" strokeWidth="0.5" />

      {/* Diamond vertex markers on outer points */}
      {outerPts.map((p, i) => (
        <rect
          key={`d${i}`}
          x={p.x - 2.5}
          y={p.y - 2.5}
          width={5}
          height={5}
          fill="var(--gold)"
          fillOpacity="0.7"
          transform={`rotate(45 ${p.x} ${p.y})`}
        />
      ))}
    </g>
  );
}

function polygonPoints(n: number, r: number, offset: number) {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const angle = offset + (i / n) * Math.PI * 2;
    pts.push({
      x: Math.round(Math.cos(angle) * r * 100) / 100,
      y: Math.round(Math.sin(angle) * r * 100) / 100,
    });
  }
  return pts;
}

function pointsToPath(pts: Array<{ x: number; y: number }>) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
}

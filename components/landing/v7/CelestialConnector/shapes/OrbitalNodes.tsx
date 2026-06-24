export interface OrbitDef {
  /** Semi-major axis (x radius). */
  rx: number;
  /** Semi-minor axis (y radius). */
  ry: number;
  /** Ellipse tilt in degrees. */
  tilt?: number;
  /** Number of nodes evenly spaced around the ellipse. Default 1. */
  nodes?: number;
  /** Node radius. Default 2.6. */
  nodeR?: number;
  /** Parametric phase offset in degrees for the node placement. */
  phase?: number;
  /** Orbit path dash pattern. Default "2 5". */
  dash?: string;
  /** Hide the orbit path line (nodes only). */
  hidePath?: boolean;
  /** Render nodes hollow (open circles) instead of filled. */
  hollow?: boolean;
  /** When set, the whole orbit slowly revolves; value is the period in seconds. */
  spin?: number;
  /** Reverse the spin direction. */
  rev?: boolean;
  /** Node fill/stroke opacity. Default 0.85. */
  opacity?: number;
}

interface OrbitalNodesProps {
  orbits: OrbitDef[];
}

/**
 * OrbitalNodes — one or more tilted elliptical orbits, each carrying several
 * evenly-spaced nodes (the small moons / planets riding dashed paths in the
 * astral references). Generalises the single-node `OrbitalMarker`. Each orbit
 * can optionally revolve via the shared `rotate` / `rotateRev` keyframes.
 */
export function OrbitalNodes({ orbits }: OrbitalNodesProps) {
  return (
    <>
      {orbits.map((o, oi) => {
        const tilt = o.tilt ?? 0;
        const count = o.nodes ?? 1;
        const nodeR = o.nodeR ?? 2.6;
        const phase = ((o.phase ?? 0) * Math.PI) / 180;
        const opacity = o.opacity ?? 0.85;

        const nodes = Array.from({ length: count }, (_, i) => {
          const a = phase + (i / count) * Math.PI * 2;
          return { x: o.rx * Math.cos(a), y: o.ry * Math.sin(a) };
        });

        const body = (
          <g transform={`rotate(${tilt})`}>
            {!o.hidePath && (
              <ellipse
                cx={0}
                cy={0}
                rx={o.rx}
                ry={o.ry}
                fill="none"
                stroke="var(--gold)"
                strokeOpacity={0.3}
                strokeWidth={0.6}
                strokeDasharray={o.dash ?? "2 5"}
              />
            )}
            {nodes.map((n, i) => (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={nodeR}
                fill={o.hollow ? "var(--void)" : "var(--gold)"}
                fillOpacity={o.hollow ? 1 : opacity}
                stroke="var(--gold)"
                strokeWidth={o.hollow ? 0.7 : 0}
                strokeOpacity={opacity}
              />
            ))}
          </g>
        );

        if (o.spin) {
          return (
            <g
              key={oi}
              style={{
                transformOrigin: "0 0",
                animation: `${o.rev ? "rotateRev" : "rotate"} ${o.spin}s linear infinite`,
              }}
            >
              {body}
            </g>
          );
        }
        return <g key={oi}>{body}</g>;
      })}
    </>
  );
}

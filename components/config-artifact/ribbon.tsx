/* A ribbon of parallel traces along one polyline (straight runs and 45°
   bends), offset with mitred joins so the strands stay parallel. */

type P = [number, number];

const normal = (a: P, b: P): P => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
};

function offset(points: P[], d: number): P[] {
  return points.map((cur, i) => {
    const prev = points[i - 1];
    const next = points[i + 1];
    if (!prev || !next) {
      const m = prev ? normal(prev, cur) : normal(cur, next);
      return [cur[0] + m[0] * d, cur[1] + m[1] * d];
    }
    const a = normal(prev, cur);
    const b = normal(cur, next);
    const mx = a[0] + b[0];
    const my = a[1] + b[1];
    const ml = Math.hypot(mx, my) || 1;
    const k = d / ((mx / ml) * a[0] + (my / ml) * a[1]);
    return [cur[0] + (mx / ml) * k, cur[1] + (my / ml) * k];
  });
}

/** From (x0, y0) run right, bend 45° to reach y1, then run right to x1. */
export function route45(x0: number, y0: number, x1: number, y1: number, lead = 16): P[] {
  const dy = y1 - y0;
  const bx = x0 + lead;
  return [
    [x0, y0],
    [bx, y0],
    [bx + Math.abs(dy), y1],
    [x1, y1],
  ];
}

export function Ribbon({
  points,
  n = 5,
  gap = 3,
  stroke,
  opacity = 0.7,
}: {
  points: P[];
  n?: number;
  gap?: number;
  stroke: string;
  opacity?: number;
}) {
  const strands = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * gap);
  return (
    <g fill="none" stroke={stroke} strokeOpacity={opacity} strokeWidth={1}>
      {strands.map((d) => (
        <path key={d} d={`M${offset(points, d).map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}`} />
      ))}
    </g>
  );
}

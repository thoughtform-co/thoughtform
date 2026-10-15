/**
 * The frontier model, drawn as a brain of circuits (ADR-156 U4, owner
 * 2026-10-15: "a cool retrofuturistic visualization of a frontier model ...
 * like a brain, but the lines on the brain are more like nodes and
 * circuits").
 *
 * A side view: the cerebrum as one rounded mass, the cerebellum tucked
 * under its back, the stem below; inside, circuit traces routed at 0, 45 and
 * 90 degrees on a grid, each ending in a pad, the way a board is routed. The
 * traces stay inside the outline; a few long ones run front to back like the
 * major folds.
 *
 * ⚠ PURE AND SEEDED: the server and the test draw the same brain. Units are
 * the figure's viewBox (the brain sits in a 360 x 260 box at `ox, oy`).
 */

export interface Brain {
  outline: string;
  traces: string[];
  pads: { x: number; y: number }[];
  /** Where the three inputs enter, along the top. */
  sockets: { x: number; y: number }[];
  /** Where the answer leaves, at the stem. */
  exit: { x: number; y: number };
}

const W = 360;
const H = 260;

/** Inside the cerebrum: an ellipse, a little flatter at the base. */
function inside(x: number, y: number): boolean {
  const cx = W * 0.5;
  const cy = H * 0.44;
  const rx = W * 0.47;
  const ry = H * (y > cy ? 0.36 : 0.42);
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy < 0.86;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS: readonly [number, number][] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export function brainDrawing(ox: number, oy: number, seed = 1956): Brain {
  const rnd = mulberry32(seed);
  const cx = W * 0.5;
  const cy = H * 0.44;
  const rx = W * 0.47;
  const ryTop = H * 0.42;
  const ryBot = H * 0.36;
  // The outline: the cerebrum's two half-ellipses, the cerebellum and stem.
  const top = `M${n1(ox + cx - rx)} ${n1(oy + cy)} A${n1(rx)} ${n1(ryTop)} 0 0 1 ${n1(ox + cx + rx)} ${n1(oy + cy)}`;
  const bottom = `A${n1(rx)} ${n1(ryBot)} 0 0 1 ${n1(ox + cx - rx)} ${n1(oy + cy)} Z`;
  const cereb = `M${n1(ox + W * 0.6)} ${n1(oy + H * 0.74)} a${n1(W * 0.13)} ${n1(H * 0.1)} 0 1 0 ${n1(W * 0.26)} 0`;
  const stem = `M${n1(ox + W * 0.56)} ${n1(oy + H * 0.78)} L${n1(ox + W * 0.58)} ${n1(oy + H * 0.98)} M${n1(ox + W * 0.64)} ${n1(oy + H * 0.8)} L${n1(ox + W * 0.63)} ${n1(oy + H * 0.98)}`;
  const outline = `${top} ${bottom} ${cereb} ${stem}`;

  const traces: string[] = [];
  const pads: { x: number; y: number }[] = [];
  const STEP = 12;
  const COUNT = 64;
  for (let t = 0; t < COUNT; t++) {
    let x = 0;
    let y = 0;
    for (let k = 0; k < 40; k++) {
      x = Math.round((cx - rx + rnd() * 2 * rx) / STEP) * STEP;
      y = Math.round((cy - ryTop + rnd() * (ryTop + ryBot)) / STEP) * STEP;
      if (inside(x, y)) break;
    }
    if (!inside(x, y)) continue;
    let dir = Math.floor(rnd() * 8);
    const pts: [number, number][] = [[x, y]];
    const segs = 4 + Math.floor(rnd() * 8);
    for (let s = 0; s < segs; s++) {
      if (rnd() < 0.35) dir = (dir + (rnd() < 0.5 ? 1 : 7)) % 8;
      const len = 1 + Math.floor(rnd() * 3);
      const nx = x + DIRS[dir][0] * STEP * len;
      const ny = y + DIRS[dir][1] * STEP * len;
      if (!inside(nx, ny)) break;
      x = nx;
      y = ny;
      pts.push([x, y]);
    }
    if (pts.length < 2) continue;
    traces.push(`M${pts.map(([px, py]) => `${n1(ox + px)} ${n1(oy + py)}`).join(" L")}`);
    pads.push({ x: ox + pts[0][0], y: oy + pts[0][1] }, { x: ox + pts[pts.length - 1][0], y: oy + pts[pts.length - 1][1] });
  }
  // Three long folds, front to back: the major sulci as buses.
  for (let f = 0; f < 3; f++) {
    const y0 = cy - ryTop * 0.5 + f * ryTop * 0.42;
    const pts: string[] = [];
    for (let k = 0; k <= 10; k++) {
      const px = cx - rx * 0.78 + (k / 10) * rx * 1.56;
      const py = y0 + Math.sin(k * 1.3 + f) * 7;
      if (inside(px, py)) pts.push(`${n1(ox + px)} ${n1(oy + py)}`);
    }
    if (pts.length > 1) traces.push(`M${pts.join(" L")}`);
  }

  const sockets = [0.32, 0.5, 0.68].map((u) => ({ x: ox + W * u, y: oy + cy - ryTop * Math.sqrt(1 - ((u - 0.5) / 0.47) ** 2) }));
  const exit = { x: ox + W * 0.6, y: oy + H * 0.98 };
  return { outline, traces, pads, sockets, exit };
}

export const BRAIN_BOX = { w: W, h: H } as const;

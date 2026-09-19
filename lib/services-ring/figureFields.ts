/**
 * figureFields — the services' VOLUMETRIC bodies as signed fields, defined
 * once and rendered in two materials: the 2D raster (`cardViz.ts`, a ray
 * march per cell) and the 3D lattice (`cardFigureVolume.ts`, the body
 * voxelised on the card's own cell grid and thrown up in front of the face).
 *
 * Space: the band's unit space — x right, y DOWN (canvas-handed, as the
 * figure record), z toward the viewer, the band's inscribed circle at R = 1.
 * A field is negative inside the body.
 *
 * Five families, each one vocabulary with four members (ADR-086's logic):
 *
 *   bodies    the figure record as fused metaballs
 *   solids    a sphere under one light · a torus · the house's chamfered
 *             slab · eight spheres fused into a ring
 *   knots     torus knots (1,3) · (2,3) · (3,4) · (2,7)
 *   dendrite  a branching growth per service (V5's rule, grown FORWARD out
 *             of the card — owner, 2026-09-19: "Dendrite is also quite
 *             interesting")
 *   relief    a heightfield on the card (the isometric terrain reference)
 *
 * ⚠ THREE-FREE, DETERMINISTIC. The dendrite's forks take a seeded PRNG on
 * the slot, never Math.random: the bake reruns on a theme flip and a tree
 * that regrew would read as a glitch.
 */

import { figureFor, type FigureSlot, type ServiceFigure } from "./serviceFigures";

export type Vec3 = readonly [number, number, number];
export type Field = (x: number, y: number, z: number) => number;

export interface FieldMark {
  /** Unit space, the band's own. */
  x: number;
  y: number;
  /** Diamond radius in the constellation's units (R 328). */
  r: number;
}

export interface Body {
  field: Field;
  marks: readonly FieldMark[];
}

export type BodyFamily = "bodies" | "solids" | "knots" | "dendrite" | "relief";

/** One light, upper-left and in front — where a HUD's key light comes from. */
export const HOLO_LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.45, -0.62, 0.64];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

/* ── deterministic noise (the dendrite's forks) ────────────────────────── */

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ── poses ─────────────────────────────────────────────────────────────── */

/** Rotate about x by `t` (the cloud's own tilt is 0.42). */
export const tiltX =
  (t: number) =>
  (x: number, y: number, z: number): Vec3 => [
    x,
    y * Math.cos(t) - z * Math.sin(t),
    y * Math.sin(t) + z * Math.cos(t),
  ];
export const yawY =
  (t: number) =>
  (x: number, y: number, z: number): Vec3 => [
    x * Math.cos(t) + z * Math.sin(t),
    y,
    -x * Math.sin(t) + z * Math.cos(t),
  ];

/* ── primitives ────────────────────────────────────────────────────────── */

export const sphereField =
  (c: Vec3, r: number): Field =>
  (x, y, z) =>
    Math.hypot(x - c[0], y - c[1], z - c[2]) - r;

/** Metaballs: the classic `Σ r²/d²` union, negative inside, balls fusing
 *  where they come within ~2.8 r of each other. */
export const metaballField =
  (balls: ReadonlyArray<{ c: Vec3; r: number }>): Field =>
  (x, y, z) => {
    let s = 0;
    for (const b of balls) {
      const dx = x - b.c[0];
      const dy = y - b.c[1];
      const dz = z - b.c[2];
      s += (b.r * b.r) / (dx * dx + dy * dy + dz * dz + 1e-6);
    }
    return 1 - s;
  };

export const torusField =
  (R: number, r: number, tilt: number, yaw: number): Field =>
  (x, y, z) => {
    const p = tiltX(tilt)(...yawY(yaw)(x, y, z));
    const q = Math.hypot(p[0], p[1]) - R;
    return Math.hypot(q, p[2]) - r;
  };

/** A slab with the house's TR + BL chamfer (canvas-handed: TR is x > 0, y < 0). */
export const slabField =
  (a: number, b: number, c: number, ch: number, tilt: number, yaw: number): Field =>
  (x, y, z) => {
    const p = tiltX(tilt)(...yawY(yaw)(x, y, z));
    const box = Math.max(Math.abs(p[0]) - a, Math.abs(p[1]) - b, Math.abs(p[2]) - c);
    const tr = (p[0] - p[1]) / Math.SQRT2 - ch;
    const bl = (p[1] - p[0]) / Math.SQRT2 - ch;
    return Math.max(box, tr, bl);
  };

export const ringOfSpheresField = (n: number, R: number, r: number, tilt: number): Field => {
  const balls: { c: Vec3; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + Math.PI / n;
    balls.push({ c: tiltX(tilt)(R * Math.cos(th), 0, R * Math.sin(th)), r });
  }
  return metaballField(balls);
};

/** A (p, q) torus knot as a tube: the curve sampled, the field the nearest
 *  sample's sphere. */
export const knotField = (
  p: number,
  q: number,
  R: number,
  r: number,
  tube: number,
  tilt: number,
  yaw: number
): Field => {
  const N = 150;
  const pts: Vec3[] = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const rr = R + r * Math.cos(q * th);
    const raw: Vec3 = [rr * Math.cos(p * th), r * Math.sin(q * th), rr * Math.sin(p * th)];
    pts.push(tiltX(tilt)(...yawY(yaw)(...raw)));
  }
  return (x, y, z) => {
    let best = Infinity;
    for (const c of pts) {
      const d = Math.hypot(x - c[0], y - c[1], z - c[2]);
      if (d < best) best = d;
    }
    return best - tube;
  };
};

export interface Capsule {
  a: Vec3;
  b: Vec3;
  r: number;
}

/** A union of capsules — a branching body. */
export const capsuleUnionField =
  (segs: readonly Capsule[]): Field =>
  (x, y, z) => {
    let best = Infinity;
    for (const s of segs) {
      const ax = s.a[0];
      const ay = s.a[1];
      const az = s.a[2];
      const bx = s.b[0] - ax;
      const by = s.b[1] - ay;
      const bz = s.b[2] - az;
      const px = x - ax;
      const py = y - ay;
      const pz = z - az;
      const bb = bx * bx + by * by + bz * bz || 1e-9;
      const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / bb));
      const d = Math.hypot(px - bx * t, py - by * t, pz - bz * t) - s.r;
      if (d < best) best = d;
    }
    return best;
  };

/** A heightfield standing on the face (z = −1) inside the unit disc: the
 *  body is everything between the face and the surface `−1 + H·h(x, y)`.
 *  ⚠ Clipped at the face as well as at the surface — without the `−1 − z`
 *  term the body ran to the grid's floor and the lattice, seating the body
 *  on its own minimum, lifted the whole relief off the card. */
export const reliefField =
  (h: (x: number, y: number) => number, H: number): Field =>
  (x, y, z) => {
    const cut = Math.hypot(x, y) - 1.02;
    const surf = -1 + H * Math.max(0, h(x, y));
    return Math.max(z - surf, -1 - z, cut);
  };

/* ── the bodies, per family and per service ────────────────────────────── */

const slotOf = (id: string): FigureSlot =>
  id === "keynote" || id === "workshop" || id === "embedded" || id === "guided-build"
    ? id
    : "embedded";

/** BODIES — the figure record as fused volumes. The radiant's source a large
 *  ball with its room as small ones; the route a worm along the walk; the
 *  mesh's reached nodes one lumpy body with the person-led nodes as small
 *  balls touching nothing; the table eight balls fused into a ring. */
export function recordBody(fig: ServiceFigure): Body {
  const K = fig.kind === "mesh" ? 0.68 : 0.8;
  const at = (i: number): Vec3 => [
    fig.points[i].x * K,
    fig.points[i].y * K,
    fig.points[i].z * K * 0.7,
  ];
  const balls: { c: Vec3; r: number }[] = [];
  switch (fig.kind) {
    case "radiant":
      balls.push({ c: at(fig.source), r: 0.34 });
      fig.lit.forEach((lit, i) => {
        if (lit && i !== fig.source) balls.push({ c: at(i), r: 0.08 });
      });
      break;
    case "route":
      for (const i of fig.path) balls.push({ c: at(i), r: 0.15 });
      break;
    case "table":
      for (const i of fig.path) balls.push({ c: at(i), r: 0.2 });
      break;
    case "mesh":
    default: {
      const open = new Set(fig.unlinked);
      fig.lit.forEach((lit, i) => {
        if (lit && fig.points[i].z > -0.15) balls.push({ c: at(i), r: 0.105 });
      });
      for (const i of open) balls.push({ c: at(i), r: 0.055 });
      break;
    }
  }
  return {
    field: metaballField(balls),
    marks: fig.marks.map((m) => ({
      x: fig.points[m.i].x * K,
      y: fig.points[m.i].y * K,
      r: m.r * 1.1,
    })),
  };
}

/** SOLIDS — four primitive bodies, each the structure's claim as a solid. */
export function solidBody(slot: FigureSlot): Body {
  switch (slot) {
    case "keynote":
      return { field: sphereField([0, 0, 0], 0.84), marks: [{ x: -0.34, y: -0.42, r: 9 }] };
    case "workshop":
      return { field: torusField(0.6, 0.27, 1.05, 0.35), marks: [] };
    case "guided-build":
      return { field: ringOfSpheresField(8, 0.66, 0.24, 1.0), marks: [] };
    case "embedded":
    default:
      // Three-quarters on, thick enough for its walls to shade — near edge-on
      // a slab is a line, the one thing this family is not allowed to be.
      return { field: slabField(0.6, 0.76, 0.2, 0.34, 0.22, -0.26), marks: [] };
  }
}

/** KNOTS — one family, four members: a torus knot per service. */
export function knotBody(slot: FigureSlot): Body {
  const pq: Record<FigureSlot, [number, number]> = {
    keynote: [1, 3],
    workshop: [2, 3],
    embedded: [3, 4],
    "guided-build": [2, 7],
  };
  const [p, q] = pq[slot];
  return { field: knotField(p, q, 0.56, 0.26, 0.13, 0.75, 0.3), marks: [] };
}

/**
 * DENDRITE — V5's rule (a growth that forks by generation, junctions the
 * reader counts, the signal at the tips), grown OUT of the card: every root
 * sits on the face (z = −1) and every branch leans toward the viewer, so
 * the body is a hologram thrown up from the surface. Per service:
 *
 *   keynote       one root, six primaries fanning wide — the radiant as growth
 *   workshop      one root, one vine with short side buds — the route
 *   embedded      one root, eight primaries, dense — the mesh
 *   guided-build  eight roots on a ring, each a short shrub — the table
 */
export function dendriteBody(slot: FigureSlot): Body {
  const rand = prng(seedOf(`dendrite:${slot}`));
  const segs: Capsule[] = [];
  const tips: Vec3[] = [];
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const grow = (
    p: Vec3,
    dir: Vec3,
    len: number,
    r: number,
    gen: number,
    maxGen: number,
    forksAt: (g: number) => number,
    spread: number
  ): void => {
    if (gen > maxGen || len < 0.07) {
      tips.push(p);
      return;
    }
    const e: Vec3 = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    segs.push({ a: p, b: e, r });
    const forks = forksAt(gen);
    for (let i = 0; i < forks; i++) {
      // Fan in the plane, lean forward: a branch that turned back into the
      // card would be a hologram going through its own screen.
      const fan = (i - (forks - 1) / 2) * spread + (rand() - 0.5) * 0.35;
      const side: Vec3 = norm([-dir[1], dir[0], 0]);
      // The lean forward is gentle: a growth that shot straight at the
      // viewer foreshortened to a clump (the first cut covered 3–9 % of the
      // band); it spreads across the card and rises with each generation.
      const next = norm([
        dir[0] + side[0] * fan + (rand() - 0.5) * 0.25,
        dir[1] + side[1] * fan + (rand() - 0.5) * 0.25,
        Math.max(0.15, dir[2] + 0.05 + (rand() - 0.5) * 0.15),
      ]);
      grow(
        e,
        next,
        len * (0.66 + rand() * 0.14),
        Math.max(0.06, r * 0.76),
        gen + 1,
        maxGen,
        forksAt,
        spread
      );
    }
  };
  const root: Vec3 = [0, 0, -1];
  switch (slot) {
    case "keynote":
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        grow(
          root,
          norm([Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.7]),
          0.46,
          0.11,
          0,
          3,
          (g) => (g < 1 ? 3 : 2),
          0.95
        );
      }
      break;
    case "workshop":
      grow(
        [-0.88, 0.4, -1],
        norm([1, -0.42, 0.4]),
        0.44,
        0.115,
        0,
        7,
        (g) => (g % 2 === 1 ? 2 : 1),
        0.85
      );
      break;
    case "guided-build":
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const r0: Vec3 = [Math.cos(a) * 0.72, Math.sin(a) * 0.72 * 0.8, -1];
        grow(
          r0,
          norm([-Math.cos(a) * 0.5, -Math.sin(a) * 0.5, 0.8]),
          0.34,
          0.105,
          0,
          2,
          () => 2,
          1.0
        );
      }
      break;
    case "embedded":
    default:
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        grow(
          root,
          norm([Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0.75]),
          0.38,
          0.1,
          0,
          3,
          (g) => (g < 1 ? 3 : 2),
          0.85
        );
      }
      break;
  }
  // The tips carry the signal: growth is legible at its edge, not its root —
  // and only tips inside the band carry one (a mark over the type margin is
  // a mark on the wrong object).
  const marks = tips
    .filter((t, i) => i % 7 === 0 && Math.hypot(t[0], t[1]) < 0.95)
    .map((t) => ({ x: t[0], y: t[1], r: 5 }));
  // Clipped at the face plane: a root's capsule would otherwise reach 0.1
  // behind it, and a hologram does not go through its own screen.
  const union = capsuleUnionField(segs);
  return { field: (x, y, z) => Math.max(union(x, y, z), -1 - z), marks };
}

/**
 * RELIEF — a heightfield on the card, the isometric terrain reference's
 * grammar: keynote one peak with radial ridges (the radiant), workshop a
 * broad ridge winding across the field and rising toward its exit (the
 * route), embedded a plateau with three mounds where the seats sit (the
 * mesh), guided-build a crater rim around a flat floor (the table).
 */
export function reliefBody(slot: FigureSlot): Body {
  const smooth = (edge0: number, edge1: number, v: number) => {
    const t = Math.max(0, Math.min(1, (v - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };
  switch (slot) {
    case "keynote":
      return {
        field: reliefField((x, y) => {
          const r = Math.hypot(x, y);
          const th = Math.atan2(y, x);
          return Math.exp((-r * r) / 0.22) * (0.72 + 0.28 * Math.cos(12 * th));
        }, 1.3),
        marks: [{ x: 0, y: 0, r: 9 }],
      };
    case "workshop":
      return {
        field: reliefField((x, y) => {
          const path = 0.35 * Math.sin(2.4 * x + 0.5);
          const d = y - path;
          return (
            Math.exp((-d * d) / 0.045) *
            (0.55 + 0.45 * ((x + 1) / 2)) *
            (1 - smooth(0.85, 1.02, Math.hypot(x, y)))
          );
        }, 1.1),
        marks: [
          { x: -0.9, y: 0.35 * Math.sin(2.4 * -0.9 + 0.5), r: 7 },
          { x: 0.9, y: 0.35 * Math.sin(2.4 * 0.9 + 0.5), r: 8 },
        ],
      };
    case "guided-build":
      return {
        field: reliefField((x, y) => {
          const r = Math.hypot(x, y);
          return (
            Math.exp(-((r - 0.6) * (r - 0.6)) / 0.02) * 0.9 + 0.22 * (1 - smooth(0.42, 0.55, r))
          );
        }, 1.2),
        marks: [],
      };
    case "embedded":
    default: {
      const fig = figureFor("embedded");
      const seats = fig.marks.map((m) => ({
        x: fig.points[m.i].x * 0.75,
        y: fig.points[m.i].y * 0.75,
        r: m.r,
      }));
      return {
        field: reliefField((x, y) => {
          const r = Math.hypot(x, y);
          let h = 0.32 * (1 - smooth(0.74, 0.9, r));
          for (const s of seats) {
            const dx = x - s.x;
            const dy = y - s.y;
            h += 0.7 * Math.exp(-(dx * dx + dy * dy) / 0.05);
          }
          return h;
        }, 1.2),
        marks: seats.map((s) => ({ x: s.x, y: s.y, r: s.r * 1.1 })),
      };
    }
  }
}

/** The body for a family and a slot (an unknown slot draws the embedded one). */
export function bodyFor(family: BodyFamily, id: string): Body {
  const slot = slotOf(id);
  switch (family) {
    case "bodies":
      return recordBody(figureFor(slot));
    case "solids":
      return solidBody(slot);
    case "knots":
      return knotBody(slot);
    case "dendrite":
      return dendriteBody(slot);
    case "relief":
      return reliefBody(slot);
  }
}

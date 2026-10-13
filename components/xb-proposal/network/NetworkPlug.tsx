"use client";

/* The stack travels, then the view draws back (owner, 2026-10-12). The
   closed stack that ends "Embed, encode, run." is not redrawn here: once that
   section's pin lets go, its drawing is hidden and this one takes the stack
   from the exact place, and at the exact size, it was left on screen, and
   carries it down into this section. Pinned here, the stack turns to face
   the reader and flattens into the three courses of one module (your team,
   the layer, your agents, lettered on their fronts); a notched frame closes
   round it, X-Bionic Marketing in the intelligence configuration's housing
   (TR and BL cut, the gold head band); and eight-wire circuit ribbons run
   out on both sides to the other departments, each drawn as that frame
   collapsed to its band, with "Navigate next" under it: the next team starts its own turn of the Arc.

   The plates are EmbedStack's own drawing, copied with the projection made a
   parameter, drawn through a true orthographic camera whose yaw and pitch
   run from that section's isometric (45 and 35.26 degrees, at its scale, so
   the first frame is the stack as it left) to the front, so the turn is a
   rotation of the object. As the plates go edge-on their faces become the
   module's courses, which thicken to their rest.

   Every ribbon starts on the frame's edge and ends on its card's edge,
   computed from the same numbers that draw those edges, and every wire of a
   ribbon is the centre line offset with mitred corners, so the eight stay
   parallel through each 45-degree jog. Line work is SVG in a 1200 x 560
   frame; every word is DOM seated in percent of it and sized in `cqw`. One
   scroll reader; reduced motion reads the last frame; `?netp=0..1` pins a
   moment for stills. */

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH, type GlyphName } from "../glyphs";
import { tint, type Box, type Iso } from "../iso";
import { LayerSlab } from "../LayerSlab";
import { MastheadTitle } from "../Masthead";

const W = 1200;
const H = 560;
/* EmbedStack's unit and drawing, and the camera scale that reproduces its
   isometric: makeIso's x step is cos30 * u, a 45-degree yaw gives cos45 * U */
const U26 = 26;
const U_ISO = U26 * Math.sqrt(1.5);
const ES_VB_W = 700;
const ES_OX = 350;
const ES_OY = 70;
const ISO_YAW = Math.PI / 4;
const ISO_PITCH = Math.atan(1 / Math.SQRT2);
/* the closed stack's spacing there: 72 px a plate, in z */
const GAP_Z = 72 / U26;
/* the module at rest: each plate's highest point, the course it becomes,
   the pitch between courses, and the size it is drawn at */
const TOP_Z = [0.4, 1.08, 0.75];
const COURSE_H = 1.0;
const COURSE_GAP = 1.24;
const END_K = 1.0;

const TITLE = ["Marketing first,", "then every team."] as const;
/* each course is lettered with its step of the Arc and what it is */
const COURSES = ["Navigate · your team", "Encode · the layer", "Build · your agents"] as const;

/* -- the camera --------------------------------------------------------- */

type Cam = { yaw: number; pitch: number; cx: number; cy: number; k: number; zc: number };

/** An `Iso` for the camera, so the plates draw through it unchanged: world
    (4, 4, zc) lands on (cx, cy), and `dz` lifts one plate. */
function camIso(c: Cam, dz: number): Iso {
  const u = U_ISO * c.k;
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const sp = Math.sin(c.pitch);
  const cp = Math.cos(c.pitch);
  const p = (x: number, y: number, z: number): readonly [number, number] => {
    const X = x - 4;
    const Y = y - 4;
    const Z = z + dz - c.zc;
    return [c.cx + u * (X * cy - Y * sy), c.cy + u * ((X * sy + Y * cy) * sp - Z * cp)];
  };
  const plane = (x: number, y: number, z: number, k: number) => {
    const [e, f] = p(x, y, z);
    return `matrix(${u * cy * k} ${u * sy * sp * k} ${-u * sy * k} ${u * cy * sp * k} ${e} ${f})`;
  };
  return { u: U26 * c.k, p, plane };
}

/* each plate's lift: the closed stack's at the start, the module's at rest */
const dzStart = (i: number) => -i * GAP_Z;
const dzEnd = (i: number) => -i * COURSE_GAP - TOP_Z[i];
/* the camera's centre height: the layer plate's top in the closed stack,
   the module's middle at rest */
const ZC_START = 0.4 - GAP_Z;
const ZC_END = -(2 * COURSE_GAP + COURSE_H) / 2;

/* -- the frame and the departments -------------------------------------- */

type Pt = [number, number];
const FR = { x0: 400, x1: 800, y0: 136, y1: 452, cut: 22, band: 36 };
const STACK_AT: Pt = [600, 312];

const DEPTS: { name: string; side: "l" | "r"; y: number }[] = [
  { name: "Product design", side: "l", y: 150 },
  { name: "Sales", side: "l", y: 294 },
  { name: "Customer care", side: "l", y: 438 },
  { name: "Technology", side: "r", y: 150 },
  { name: "Operations", side: "r", y: 294 },
  { name: "Finance", side: "r", y: 438 },
];
/* the order they light: alternating sides, top down */
const ORDER = [0, 3, 1, 4, 2, 5];
/* a department is the Marketing frame collapsed to its band */
/* a department is the Marketing frame at a smaller size: the gold band with
   its name, the body under it with what comes next, TR and BL cut */
const CARD = { w: 236, h: 72, band: 30, l: 36, r: W - 36 - 236, cut: 12 };
/* where each ribbon leaves the frame: three ports a side */
const PORT_Y = [222, 294, 366];
const WIRES = 8;
const PITCH = 3.4;

/** The centre line of a department's ribbon: out of the frame, a 45-degree
    jog onto the card's centre line, in to the card's edge. */
function ribbonLine(i: number): Pt[] {
  const d = DEPTS[i];
  const y0 = PORT_Y[i % 3];
  const y1 = d.y;
  const dy = Math.abs(y1 - y0);
  const s = d.side === "l" ? -1 : 1;
  const x0 = d.side === "l" ? FR.x0 : FR.x1;
  const x1 = d.side === "l" ? CARD.l + CARD.w : CARD.r;
  const xa = x0 + s * 22;
  if (dy < 0.5)
    return [
      [x0, y0],
      [x1, y1],
    ];
  return [
    [x0, y0],
    [xa, y0],
    [xa + s * dy, y1],
    [x1, y1],
  ];
}

/** A polyline offset by `d` with mitred corners. */
function offsetLine(pts: Pt[], d: number): Pt[] {
  const n = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  };
  return pts.map((p, i) => {
    const prev = i > 0 ? n(pts[i - 1], p) : null;
    const next = i < pts.length - 1 ? n(p, pts[i + 1]) : null;
    if (!prev || !next) {
      const m = (prev ?? next)!;
      return [p[0] + m[0] * d, p[1] + m[1] * d];
    }
    const dot = prev[0] * next[0] + prev[1] * next[1];
    const k = d / (1 + dot);
    return [p[0] + (prev[0] + next[0]) * k, p[1] + (prev[1] + next[1]) * k];
  });
}
const pathOf = (pts: Pt[]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
const ptsOf = (list: number[][]) => list.map((q) => q.join(",")).join(" ");

/** A box with its TR and BL corners cut, the configuration's housing. */
const cutBox = (x0: number, y0: number, x1: number, y1: number, c: number) =>
  ptsOf([
    [x0, y0],
    [x1 - c, y0],
    [x1, y0 + c],
    [x1, y1],
    [x0 + c, y1],
    [x0, y1 - c],
  ]);
/** The frame's head band, its top-right corner cut with the frame's. */
const frameBand = () =>
  ptsOf([
    [FR.x0, FR.y0],
    [FR.x1 - FR.cut, FR.y0],
    [FR.x1, FR.y0 + FR.cut],
    [FR.x1, FR.y0 + FR.band],
    [FR.x0, FR.y0 + FR.band],
  ]);

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(5), "--py": (y / H).toFixed(5) }) as CSSProperties;

/** Everything the pinned scroll moves, from its reading `p`. */
function moment(p: number) {
  const ribAt = (n: number) => 0.5 + n * 0.065;
  return {
    move: ease(seg(p, 0, 0.2)),
    turn: ease(seg(p, 0.04, 0.34)),
    frame: ease(seg(p, 0.32, 0.44)),
    rib: (i: number) => ease(seg(p, ribAt(ORDER.indexOf(i)), ribAt(ORDER.indexOf(i)) + 0.1)),
    on: (i: number) => p >= ribAt(ORDER.indexOf(i)) + 0.095,
  };
}

/* -- EmbedStack's plates, the projection a parameter -------------------- */

const S = 8;
const NOTCH = 0;
const GOLD = "var(--xb-gold)";
const GREEN = "var(--es-green)";
const DAWN = "var(--xb-text)";
const TONES = [GREEN, GOLD, DAWN] as const;

type P = readonly [number, number];
const pts = (list: P[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const quad = (iso: Iso, x0: number, y0: number, x1: number, y1: number, z: number) =>
  pts([iso.p(x0, y0, z), iso.p(x1, y0, z), iso.p(x1, y1, z), iso.p(x0, y1, z)]);

/** A box, its (x1, y0) corner notched: the house's single TR notch laid in
    the plane. The cut's own face is edge-on here, so the outline carries it. */
function NotchedBox({
  iso,
  b,
  c = NOTCH,
  stroke,
  side,
  top = "var(--xb-ground)",
}: {
  iso: Iso;
  b: Box;
  c?: number;
  stroke: string;
  side: string;
  top?: string;
}) {
  const p = iso.p;
  const left = pts([
    p(b.x0, b.y1, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x1, b.y1, b.z0),
    p(b.x0, b.y1, b.z0),
  ]);
  const right = pts([
    p(b.x1, b.y0 + c, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x1, b.y1, b.z0),
    p(b.x1, b.y0 + c, b.z0),
  ]);
  const face = pts([
    p(b.x0, b.y0, b.z1),
    p(b.x1 - c, b.y0, b.z1),
    p(b.x1, b.y0 + c, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x0, b.y1, b.z1),
  ]);
  return (
    <g>
      <polygon points={left} fill={side} stroke={stroke} strokeWidth={1} />
      <polygon points={right} fill={side} stroke={stroke} strokeWidth={1} />
      <polygon points={face} fill={top} stroke={stroke} strokeWidth={1} />
    </g>
  );
}

const PLATE: Box = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, z1: 0.4 };

/* ── the three plates, each drawn at z 0 and moved by its group ────────── */

function TeamPlate({ iso }: { iso: Iso }) {
  const z = PLATE.z1;
  const tiles: { id: GlyphName; x: number; y: number }[] = [
    { id: "strategy", x: 1.6, y: 0.6 },
    { id: "production", x: 4.6, y: 1.9 },
    { id: "review", x: 1.6, y: 3.8 },
    { id: "ops", x: 4.6, y: 5.0 },
  ];
  return (
    <g>
      <NotchedBox iso={iso} b={PLATE} stroke={GREEN} side="var(--xb-ground-2)" />
      {/* the rail of the tools the team already has, along one edge */}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 0.5 + i * 0.68;
        const [a, b] = [iso.p(0.35, y, z), iso.p(1.15, y + 0.4, z)];
        return (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={GREEN}
            strokeOpacity={0.55}
          />
        );
      })}
      <polygon
        points={quad(iso, 0.25, 0.3, 1.25, 7.7, z)}
        fill="none"
        stroke={GREEN}
        strokeOpacity={0.7}
      />
      {tiles.map((t) => (
        <g key={t.id}>
          <polygon
            points={quad(iso, t.x, t.y, t.x + 2.6, t.y + 2.6, z)}
            fill={tint("var(--es-green)", 0.12)}
            stroke={GREEN}
          />
          <path
            d={GLYPH[t.id]}
            transform={iso.plane(t.x + 0.6, t.y + 0.6, z, 1.4 / 24)}
            fill="none"
            stroke={GREEN}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </g>
  );
}

/* The layer's face, after the flow's core above it (owner, 2026-10-12: "add
   some circles, like diagrams, around the brand mark … make it look as if
   the brand mark is engraved in it, with a bit more depth"). Three rings in
   the plane round the mark, the middle one gold with the layer's three parts
   on it (context, skills, evals), the outer one dashed; and the mark CUT into
   the top course: its opening drawn as the lit far wall, its floor one depth
   down and darker, clipped to the opening, so only the wall's upper edge
   shows. The floor darkens toward black in both themes (a recess is a
   shadow either way); the wall is the gold. */
const MARK_H = 3.2;
const CUT = 0.11;
const RINGS = [2.25, 2.8, 3.35] as const;
const PART_DEG = [-140, -38, 62];
const WASH = "var(--gold, #caa554)";

function LayerPlate({ iso }: { iso: Iso }) {
  const g = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, t: 0.28, gap: 0.12 };
  const top = g.z0 + 2 * (g.t + g.gap) + g.t;
  const mk = BRANDMARK_VIEWBOX;
  const k = MARK_H / mk.h;
  const mx = S / 2 - (mk.w * k) / 2;
  const my = S / 2 - MARK_H / 2;
  const at = (z: number) => iso.plane(mx, my, z, k);
  const clip = `es-cut-${useId().replace(/:/g, "")}`;
  const surface = tint(WASH, 0.28);
  return (
    <g>
      <LayerSlab iso={iso} g={g} />
      {/* the rings, in the plane, round the mark */}
      <g transform={iso.plane(S / 2, S / 2, top, 1)}>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke={GOLD}
            strokeOpacity={i === 1 ? 0.85 : 0.4}
            strokeDasharray={i === 2 ? "2 4" : undefined}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {PART_DEG.map((d) => {
          const a = (d * Math.PI) / 180;
          return (
            <circle
              key={d}
              cx={RINGS[1] * Math.cos(a)}
              cy={RINGS[1] * Math.sin(a)}
              r={0.12}
              fill={GOLD}
            />
          );
        })}
      </g>
      {/* the mark, cut into the top course */}
      <defs>
        <clipPath id={clip}>
          {BRANDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} transform={at(top)} />
          ))}
        </clipPath>
      </defs>
      <g transform={at(top)}>
        {BRANDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill={tint(WASH, 0.72)} />
        ))}
      </g>
      <g clipPath={`url(#${clip})`}>
        <g transform={at(top - CUT)}>
          {BRANDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill={`color-mix(in srgb, ${surface} 55%, #000)`} />
          ))}
        </g>
      </g>
      <g transform={at(top)}>
        {BRANDMARK_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.55}
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </g>
  );
}

/** Four parallel wires, one ribbon: along one axis, a 45° jog in the plane,
    then along the other, the instrument's `ribbonPaths` grammar. */
function Ribbon({ iso, from, to, axis }: { iso: Iso; from: P; to: P; axis: "x" | "y" }) {
  const z = PLATE.z1;
  const wires = [-0.24, -0.08, 0.08, 0.24];
  return (
    <g>
      {wires.map((o) => {
        const sx = Math.sign(to[0] - from[0]) || 1;
        const sy = Math.sign(to[1] - from[1]) || 1;
        let path: P[];
        if (axis === "x") {
          const [x0, y0] = [from[0], from[1] + o];
          const [x1, y1] = [to[0] + o, to[1]];
          const jog = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
          path = [
            [x0, y0],
            [x1 - sx * jog, y0],
            [x1, y0 + sy * jog],
            [x1, y1],
          ];
        } else {
          const [x0, y0] = [from[0] + o, from[1]];
          const [x1, y1] = [to[0], to[1] + o];
          const jog = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
          path = [
            [x0, y0],
            [x0, y1 - sy * jog],
            [x0 + sx * jog, y1],
            [x1, y1],
          ];
        }
        const d = path
          .map(([x, y], i) => {
            const [qx, qy] = iso.p(x, y, z);
            return `${i ? "L" : "M"}${qx.toFixed(1)} ${qy.toFixed(1)}`;
          })
          .join("");
        return <path key={o} d={d} fill="none" stroke={DAWN} strokeOpacity={0.6} strokeWidth={1} />;
      })}
    </g>
  );
}

/* The agents' plate: one chip at the centre, four agent modules, each on
   its own ribbon. The chip is notched like every plate; the modules are the
   agents your people run. */
const CHIP: Box = { x0: 3.0, x1: 5.0, y0: 3.0, y1: 5.0, z0: 0.4, z1: 0.75 };
const MODULES: Box[] = [
  { x0: 0.7, x1: 2.1, y0: 0.7, y1: 2.1, z0: 0.4, z1: 0.62 },
  { x0: 5.4, x1: 6.8, y0: 1.4, y1: 2.8, z0: 0.4, z1: 0.62 },
  { x0: 0.9, x1: 2.3, y0: 5.5, y1: 6.9, z0: 0.4, z1: 0.62 },
  { x0: 5.7, x1: 7.1, y0: 5.6, y1: 7.0, z0: 0.4, z1: 0.62 },
];

function AgentPlate({ iso }: { iso: Iso }) {
  const z = PLATE.z1;
  return (
    <g>
      <NotchedBox iso={iso} b={PLATE} stroke={DAWN} side="var(--xb-ground-2)" />
      {/* ribbons first, so the chip and the modules sit on them */}
      <Ribbon iso={iso} from={[3.0, 3.6]} to={[1.4, 2.1]} axis="x" />
      <Ribbon iso={iso} from={[4.4, 3.0]} to={[5.4, 2.1]} axis="y" />
      <Ribbon iso={iso} from={[3.6, 5.0]} to={[2.3, 6.2]} axis="y" />
      <Ribbon iso={iso} from={[5.0, 4.4]} to={[6.4, 5.6]} axis="x" />
      {/* the chip's pins, a short comb on its two front edges */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = 3.2 + i * 0.32;
        const a = iso.p(5.0, y, z);
        const b = iso.p(5.25, y, z);
        return (
          <line
            key={`p${i}`}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={DAWN}
            strokeOpacity={0.5}
          />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const x = 3.2 + i * 0.32;
        const a = iso.p(x, 5.0, z);
        const b = iso.p(x, 5.25, z);
        return (
          <line
            key={`q${i}`}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={DAWN}
            strokeOpacity={0.5}
          />
        );
      })}
      <NotchedBox iso={iso} b={CHIP} stroke={DAWN} side="var(--xb-ground-2)" />
      <polygon
        points={quad(iso, 3.45, 3.45, 4.55, 4.55, CHIP.z1)}
        fill="none"
        stroke={DAWN}
        strokeOpacity={0.5}
      />
      {MODULES.map((m, i) => (
        <g key={i}>
          <NotchedBox iso={iso} b={m} stroke={DAWN} side="var(--xb-ground-2)" />
          <polygon
            points={quad(iso, m.x0 + 0.35, m.y0 + 0.35, m.x1 - 0.35, m.y1 - 0.35, m.z1)}
            fill={tint("var(--xb-text)", 0.1)}
            stroke="none"
          />
        </g>
      ))}
      {/* a row of pads along the front edge, the board's own texture */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 3.0 + i * 0.36;
        return (
          <polygon
            key={`d${i}`}
            points={quad(iso, x, 7.35, x + 0.2, 7.6, z)}
            fill={DAWN}
            fillOpacity={0.35}
          />
        );
      })}
    </g>
  );
}

/* -- the section -------------------------------------------------------- */

export const PLATES = [TeamPlate, LayerPlate, AgentPlate];

/** Where EmbedStack left its stack, in that drawing's units: the layer
    plate's top centre, (4, 4, 0.4) through its makeIso, one closed gap down. */
const ES_CENTRE: Pt = [ES_OX, ES_OY + 8 * 0.5 * U26 - 0.4 * U26 + 72];

type Reading = {
  /** the pinned scroll, 0..1 */
  p: number;
  /** the hand-over, 0 while the steps section still holds the stack, 1 once
      this section is pinned */
  q: number;
  /** where the steps section left the stack, in this frame's units, and the
      size it was drawn at; null when there is no steps section to take from */
  from: { x: number; y: number; k: number } | null;
};

export function NetworkPlug() {
  const runway = useRef<HTMLDivElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const [r, setR] = useState<Reading>({ p: 0, q: 0, from: null });

  useEffect(() => {
    const fp = new URLSearchParams(window.location.search).get("netp");
    const fixedP =
      fp !== null
        ? clamp01(Number(fp))
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 1
          : null;
    const el = runway.current;
    const box = fig.current;
    const es = document.querySelector<HTMLElement>(".es");
    const esSvg = es?.querySelector<SVGSVGElement>(".es-svg") ?? null;
    const esPin = es?.querySelector<HTMLElement>(".es-pin") ?? null;
    let raf = 0;
    const read = () => {
      raf = 0;
      if (fixedP !== null || !el || !box) {
        setR({ p: fixedP ?? 1, q: 1, from: null });
        return;
      }
      const rr = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const p = clamp01(-rr.top / Math.max(1, rr.height - vh));
      const q = clamp01(1 - rr.top / vh);
      let from: Reading["from"] = null;
      if (es && esSvg && esPin) {
        const f = box.getBoundingClientRect();
        const kF = f.width / W;
        const s = esSvg.getBoundingClientRect();
        const kES = s.width / ES_VB_W;
        /* the steps section's pin has let go and is scrolling away: put the
           stack back where it was pinned */
        const lift = esPin.getBoundingClientRect().top;
        from = {
          x: (s.left + ES_CENTRE[0] * kES - f.left) / kF,
          y: (s.top + ES_CENTRE[1] * kES - lift - f.top) / kF,
          k: kES / kF,
        };
        /* the steps section's drawing steps aside the moment this one has
           the stack */
        if (q > 0) es.setAttribute("data-handed", "");
        else es.removeAttribute("data-handed");
      }
      setR({ p, q, from });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    /* the first reading lands on the next frame */
    const first = requestAnimationFrame(read);
    if (fixedP !== null) return () => cancelAnimationFrame(first);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
      es?.removeAttribute("data-handed");
    };
  }, []);

  const st = moment(r.p);
  const travel = ease(r.q);
  const k0 = r.from?.k ?? 1;
  const cam: Cam = {
    yaw: lerp(ISO_YAW, 0, st.turn),
    pitch: lerp(ISO_PITCH, 0, st.turn),
    cx: r.from ? lerp(r.from.x, STACK_AT[0], travel) : STACK_AT[0],
    cy: r.from ? lerp(r.from.y, STACK_AT[1], travel) : STACK_AT[1],
    k: lerp(k0, END_K, st.turn),
    zc: lerp(ZC_START, ZC_END, st.turn),
  };
  const isos = [0, 1, 2].map((i) => camIso(cam, lerp(dzStart(i), dzEnd(i), st.turn)));
  /* the plates go edge-on and become the courses, which thicken to rest */
  const platesOut = 1 - seg(st.turn, 0.8, 0.97);
  const coursesIn = seg(st.turn, 0.78, 0.92);
  const th = lerp(0.4, COURSE_H, seg(st.turn, 0.82, 1));
  const shown = r.q > 0 || !r.from;
  const offs = Array.from({ length: WIRES }, (_, k) => (k - (WIRES - 1) / 2) * PITCH);

  return (
    <div className="xn" ref={runway}>
      <div className="xn-pin">
        <MastheadTitle lines={TITLE} />
        <div className="xn-fig" ref={fig}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="xn-svg"
            role="img"
            aria-label="The stack of three plates, your team, the layer and your agents, travels down from the section above and turns to face the reader as one module of three courses, inside a notched frame: X-Bionic Marketing. From the frame, circuit ribbons run out on both sides to the departments that start their own Navigate next: product design, sales, customer care, technology, operations and finance."
          >
            {/* the ribbons, a faint lane first, under the frame's edge */}
            {DEPTS.map((d, i) => {
              const line = ribbonLine(i);
              return (
                <g key={d.name} style={{ opacity: st.frame }}>
                  {offs.map((o) => (
                    <path key={`t${o}`} d={pathOf(offsetLine(line, o))} className="xn-lane" />
                  ))}
                  {offs.map((o) => (
                    <path
                      key={`w${o}`}
                      d={pathOf(offsetLine(line, o))}
                      pathLength={1}
                      className="xn-rib"
                      style={{ strokeDashoffset: 1 - st.rib(i) }}
                    />
                  ))}
                </g>
              );
            })}

            {/* Marketing, in the configuration's housing */}
            <g style={{ opacity: st.frame }}>
              <polygon
                points={cutBox(FR.x0, FR.y0, FR.x1, FR.y1, FR.cut)}
                className="xn-frame__body"
              />
              <polygon points={frameBand()} className="xn-frame__band" />
              <line
                x1={FR.x0}
                x2={FR.x1}
                y1={FR.y0 + FR.band}
                y2={FR.y0 + FR.band}
                className="xn-frame__rule"
              />
              {DEPTS.map((d, i) => (
                <rect
                  key={d.name}
                  className="xn-port"
                  x={(d.side === "l" ? FR.x0 : FR.x1) - 3}
                  y={PORT_Y[i % 3] - 3}
                  width={6}
                  height={6}
                  opacity={st.rib(i) > 0 ? 1 : 0.35}
                />
              ))}
            </g>

            {/* the departments: the Marketing frame at a smaller size */}
            {DEPTS.map((d, i) => {
              const x = d.side === "l" ? CARD.l : CARD.r;
              const y0 = d.y - CARD.h / 2;
              const xe = d.side === "l" ? x + CARD.w : x;
              return (
                <g
                  key={d.name}
                  className="xn-dept"
                  data-on={st.on(i) ? "" : undefined}
                  style={{ opacity: st.frame }}
                >
                  <polygon
                    className="xn-frame__body"
                    points={cutBox(x, y0, x + CARD.w, y0 + CARD.h, CARD.cut)}
                  />
                  <polygon
                    className="xn-frame__band"
                    points={ptsOf([
                      [x, y0],
                      [x + CARD.w - CARD.cut, y0],
                      [x + CARD.w, y0 + CARD.cut],
                      [x + CARD.w, y0 + CARD.band],
                      [x, y0 + CARD.band],
                    ])}
                  />
                  <line
                    className="xn-frame__rule"
                    x1={x}
                    x2={x + CARD.w}
                    y1={y0 + CARD.band}
                    y2={y0 + CARD.band}
                  />
                  {/* the ribbon's port, centred on the card's edge */}
                  <rect
                    className="xn-port"
                    x={xe - 3}
                    y={d.y - 3}
                    width={6}
                    height={6}
                    opacity={st.rib(i) >= 1 ? 1 : 0.35}
                  />
                </g>
              );
            })}

            {/* the stack itself, the steps section's own plates */}
            {shown && platesOut > 0.01 && (
              <g opacity={platesOut}>
                {[2, 1, 0].map((i) => {
                  const Plate = PLATES[i];
                  return <Plate key={i} iso={isos[i]} />;
                })}
              </g>
            )}
            {/* the courses they become */}
            {shown && coursesIn > 0 && (
              <g opacity={coursesIn}>
                {[2, 1, 0].map((i) => {
                  const pr = isos[i].p;
                  const z1 = TOP_Z[i];
                  const z0 = z1 - th;
                  const front = [pr(0, S, z1), pr(S, S, z1), pr(S, S, z0), pr(0, S, z0)];
                  const [fr] = pr(S, S, z1);
                  const fy = pr(S, S, z1 - th / 2)[1];
                  return (
                    <g key={i} stroke={TONES[i]}>
                      <polygon
                        className="xn-face"
                        points={front.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
                      />
                      <line x1={fr - 30} x2={fr - 12} y1={fy} y2={fy} strokeOpacity={0.8} />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* every word, seated in the frame */}
          <div className="xn-words">
            <span
              className="xn-band"
              style={{ ...at(FR.x0 + 18, FR.y0 + FR.band / 2), opacity: st.frame }}
            >
              X-Bionic &middot; Marketing
            </span>
            <span
              className="xn-band xn-state"
              style={{ ...at(FR.x0 + 18, FR.y1 - 26), opacity: st.frame }}
            >
              Run by your team
            </span>
            {shown &&
              COURSES.map((c, i) => {
                const pr = isos[i].p;
                const [x, y] = pr(0, S, TOP_Z[i] - th / 2);
                return (
                  <span
                    key={c}
                    className="xn-course"
                    data-tone={i}
                    style={{ ...at(x + 16, y), opacity: seg(st.turn, 0.9, 1) }}
                  >
                    {c}
                  </span>
                );
              })}
            {DEPTS.map((d, i) => {
              const x = d.side === "l" ? CARD.l : CARD.r;
              const on = st.on(i);
              return [
                <span
                  key={d.name}
                  className="xn-band xn-band--dept"
                  data-on={on ? "" : undefined}
                  style={{ ...at(x + 16, d.y - CARD.h / 2 + CARD.band / 2), opacity: st.frame }}
                >
                  {d.name}
                </span>,
                <span
                  key={`${d.name}-next`}
                  className="xn-next"
                  style={{
                    ...at(x + 16, d.y - CARD.h / 2 + CARD.band + (CARD.h - CARD.band) / 2),
                    opacity: on ? 1 : 0,
                  }}
                >
                  Navigate next
                </span>,
              ];
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * F1 · Wafer Terraces (machine-mind round three, 2026-10-17; owner: "more
 * blocky so it really feels like it's built out of a motherboard … with
 * these elevations so they really look like wafers … really making it
 * visible that it looks like a brain … a USB-B port or something").
 *
 * The keynote's layered brain rebuilt as a stack of sixteen silicon wafers,
 * each the brain's own level section (sulci carved, so every edge is
 * notched where a sulcus crosses it) routed into a board edge: long runs,
 * level, plumb or 45°. Per wafer, floor to crown:
 *
 *   bond line   a dark underfill, inset, in the gap under it
 *   body        dark silicon, shaded by the kit's facing tones
 *   edge band   a thin bright metal band round its top edge
 *   tread       the step the wafer above leaves open carries a printed
 *               ring of circuitry: in some stretches a die grid (dies and
 *               scribe lines, partial dies left off at the edge), in others
 *               parallel gold traces running along the tread, their ends on
 *               vias, with a few SMD parts; and through-silicon vias, short
 *               gold runs dropping down the wafer's edge to the tread below
 *
 * The left crown's cap is a whole wafer face of dies, the edge exclusion
 * left bare. The node sits on the right crown's cap, the one lit part, its
 * pins fanned out to vias. One USB-B receptacle sits in the front edge of
 * the left frontal lobe, spanning two wafers, facing forward: the front is
 * the face the face-on camera looks at and the isometric sees at its lower
 * right, so it reads in both.
 *
 * Pure: strings and numbers, no randomness.
 */

import { HEMI, LC, projOf, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { dotsSvg, extrude, iso, lineSvg, pathOf, solidSvg, towardViewer, type Flat, type Plane, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { heightRange, inside, mindSvg, polyD, routedOutline, sectionAt, sidesFarFirst, type HullShape, type Side } from "../hull";
import type { MindDirection, MindOptions } from "./types";

// ─── the stack ──────────────────────────────────────────────────────────────

const SHAPE: HullShape = { brain: 1, sulci: 0.085 };
/** Wafers a hemisphere, and how closely their edges are routed to the true
    section (2–3 keeps the sulcus notches; 5 is a plain octagon). */
const WAFERS = 16;
const TOL = 2;
/** The bond gap under each wafer, and the metal band round its top edge. */
const GAP = 1.3;
const BAND = 0.9;
/** The thinnest a wafer gets. */
const MIN_T = 4.5;
/** How far below the hull's crown the stack stops (the node stands on the
    cap and makes up the height). */
const CAP_DROP = 2.5;

type LF = [number, number];

/** Brain axes on the floor plane to the kit's world plane. */
const WP = (l: number, f: number): Plane => [f, -l];

/** The wafers' heights, floor to cap: equal steps along the surface (so the
    dome's steps stay narrow and its sides' wafers stand tall), half blended
    with equal height steps so every wafer keeps a body. */
function levels(): number[] {
  const [floor, crown] = heightRange(SHAPE);
  const top = crown - CAP_DROP;
  const n = 160;
  const radius = (H: number) => {
    const { ring } = sectionAt(1, H, SHAPE, 24);
    return ring.reduce((s, [l, f]) => s + Math.hypot(l - LC, f), 0) / ring.length;
  };
  const hs: number[] = [];
  const ds: number[] = [0];
  let r0 = radius(floor + 0.5);
  for (let i = 0; i <= n; i++) {
    const H = floor + 0.5 + ((top - floor - 0.5) * i) / n;
    hs.push(H);
    if (i) {
      const r = radius(H);
      ds.push(ds[i - 1] + Math.hypot(r - r0, (top - floor) / n));
      r0 = r;
    }
  }
  const out: number[] = [hs[0]];
  let j = 0;
  for (let k = 1; k < WAFERS; k++) {
    const target = (ds[n] * k) / WAFERS;
    while (ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j]);
    const bySlope = hs[j] + (hs[j + 1] - hs[j]) * a;
    const byHeight = hs[0] + ((top - hs[0]) * k) / WAFERS;
    out.push(Math.max(SLOPE * bySlope + (1 - SLOPE) * byHeight, out[k - 1] + MIN_T));
  }
  out.push(top);
  return out;
}

/** How much of the spacing follows the slope (the rest is even height). */
const SLOPE = 0.72;

let levelMemo: number[] | null = null;
const LEVELS = () => (levelMemo ??= levels());

// ─── outline geometry ───────────────────────────────────────────────────────

const areaOf = (ring: readonly LF[]) => ring.reduce((s, a, i) => s + a[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * a[1], 0) / 2;

/** A routed ring offset inward by `d` (outward when negative): every edge
    moved along its normal, neighbours re-joined at their lines' crossing. */
function offsetRing(ring: readonly LF[], d: number): LF[] {
  const n = ring.length;
  const s = areaOf(ring) > 0 ? 1 : -1;
  const lines = ring.map((a, i) => {
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / len;
    const dy = (b[1] - a[1]) / len;
    // the inward normal of a counter-clockwise ring is its left normal
    const nx = -dy * s;
    const ny = dx * s;
    return { p: [a[0] + nx * d, a[1] + ny * d] as LF, d: [dx, dy] as LF };
  });
  return lines.map((l, i) => {
    const m = lines[(i - 1 + n) % n];
    const den = m.d[0] * l.d[1] - m.d[1] * l.d[0];
    if (Math.abs(den) < 1e-9) return l.p;
    const t = ((l.p[0] - m.p[0]) * l.d[1] - (l.p[1] - m.p[1]) * l.d[0]) / den;
    return [m.p[0] + m.d[0] * t, m.p[1] + m.d[1] * t] as LF;
  });
}

/** Whether a closed ring crosses itself. */
function selfCrosses(ring: readonly LF[]): boolean {
  const n = ring.length;
  const cross = (a: LF, b: LF, c: LF) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = ring[j];
      const d = ring[(j + 1) % n];
      const d1 = cross(a, b, c);
      const d2 = cross(a, b, d);
      const d3 = cross(c, d, a);
      const d4 = cross(c, d, b);
      if (d1 * d2 < 0 && d3 * d4 < 0) return true;
    }
  }
  return false;
}

/** A point on a ring at parameter u (vertex index plus a fraction). */
const pointAt = (ring: readonly LF[], u: number): LF => {
  const n = ring.length;
  const i = ((Math.floor(u) % n) + n) % n;
  const k = u - Math.floor(u);
  const a = ring[i];
  const b = ring[(i + 1) % n];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
};

/** The polyline along a ring from u0 to u1 (u1 > u0), through its vertices. */
function along(ring: readonly LF[], u0: number, u1: number): LF[] {
  const pts: LF[] = [pointAt(ring, u0)];
  for (let v = Math.floor(u0) + 1; v < u1; v++) pts.push(pointAt(ring, v));
  pts.push(pointAt(ring, u1));
  return pts;
}

const edgeLen = (ring: readonly LF[], i: number) => {
  const a = ring[i % ring.length];
  const b = ring[(i + 1) % ring.length];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
};

// ─── tones ──────────────────────────────────────────────────────────────────

/** The wafer's own sheet: its body, its edge band, the bond line, the dies
    and the parts, through the kit's tokens on each solid. */
function sheetOf(light: boolean, gold: string, lit: string, ground: string): string {
  const t = light
    ? {
        body: ["#aea79a", "#bdb6a9", "#cbc5b9", "#d8d3c8"],
        top: "#e9e5dc",
        band: ["#8d877b", "#9b9588", "#aaa497", "#b8b2a6"],
        shell: ["#9a958b", "#a9a499", "#b8b3a8", "#c6c1b6"],
        bond: "#6d675c",
        die: "#d3cdc1",
        part: ["#5d574d", "#6b655a", "#79736a", "#878178"],
        partTop: "#4a463f",
        edge: "#8f897d",
      }
    : {
        body: ["#0e0e0d", "#161615", "#1f1e1c", "#292826"],
        top: "#33312d",
        band: ["#57534c", "#6a665e", "#7e7a71", "#928d84"],
        shell: ["#3c3a36", "#4a4743", "#58554f", "#67635c"],
        bond: "#050505",
        die: "#4c4943",
        part: ["#141312", "#1b1a18", "#22211f", "#2a2826"],
        partTop: "#47443e",
        edge: "#4b4842",
      };
  const shades = (s: string[], top: string) => `--anatomy-shade-0:${s[0]};--anatomy-shade-1:${s[1]};--anatomy-shade-2:${s[2]};--anatomy-shade-3:${s[3]};--anatomy-top:${top};--anatomy-paper:${s[1]}`;
  return [
    `.wf-body{${shades(t.body, t.top)};--anatomy-lo:${t.edge};--anatomy-faint:${t.edge}}`,
    `.wf-band{${shades(t.band, t.top)};--anatomy-lo:${t.band[2]};--anatomy-faint:${t.band[2]}}`,
    `.wf-bond{${shades([t.bond, t.bond, t.bond, t.bond], t.bond)};--anatomy-lo:${t.bond}}`,
    `.wf-part{${shades(t.part, t.partTop)};--anatomy-lo:${t.part[3]};--anatomy-mid:${t.part[3]}}`,
    `.wf-shell{${shades(t.shell, t.shell[3])};--anatomy-lo:${t.band[2]};--anatomy-mid:${t.band[2]}}`,
    `.wf-die{fill:${t.die}}`,
    `.wf-mouth{fill:${light ? "#3a362f" : "#050505"}}`,
    `.wf-tongue{fill:${light ? "#5d574d" : "#2a2826"}}`,
    `.wf-contact{fill:${gold}}`,
    `.wf-via .iso-dots circle{fill:${gold};stroke:${ground};stroke-width:.3;opacity:1}`,
    `.wf-trace{stroke:${gold}!important;opacity:1}`,
    `.wf-tsv{stroke:${gold}!important;stroke-width:1px;opacity:1}`,
    `.wf-core .iso-top{fill:${light ? "#d9b65c" : "#c9a04a"}}`,
    `.wf-core .iso-edge{stroke:${lit}}`,
  ].join("");
}

// ─── one hemisphere ─────────────────────────────────────────────────────────

interface Wafer {
  k: number;
  h0: number;
  h1: number;
  ring: LF[];
}

/** The die grid: its pitch and a die's size (the gap is the scribe line). */
const DIE_PITCH = 4.8;
const DIE_SIZE = 3.8;

/** What a tread stretch carries. */
type Pattern = "traces" | "dies" | "parts" | "none";
const PATTERNS: Pattern[] = ["traces", "dies", "traces", "parts", "none", "dies", "traces", "none"];

const at3 = (l: number, f: number, z: number, P: Projection): Flat => iso([...WP(l, f), z], P);

/** The node: a copper pad on the cap, the die on it (the one lit part), its
    pins fanned out to two staggered rows of vias. */
function nodeSvg(cl: number, cf: number, z: number, half: number, P: Projection): string {
  const box = (h: number): Plane[] => [WP(cl - h, cf - h), WP(cl + h, cf - h), WP(cl + h, cf + h), WP(cl - h, cf + h)];
  const pad = solidSvg(extrude(box(half), z, 0.9, P, { bevel: 0.4 }), { tone: "lo", crease: "lo", className: "fa-gold" });
  const top = z + 0.9;
  const die = Math.min(7, half * 0.48);
  const pins: string[] = [];
  const vias: Flat[] = [];
  const n = 5;
  const pitch = (die * 1.6) / n;
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * pitch;
      const splay = o * 1.5;
      const reach = half - 2.2 - (i % 2) * 1.8;
      const local: LF[] = [
        [die + 0.4, o],
        [die + 1.8, o],
        [die + 1.8 + Math.abs(splay - o), splay],
        [reach, splay],
      ];
      const rot = ([x, y]: LF): LF => (s === 0 ? [x, y] : s === 1 ? [-y, x] : s === 2 ? [-x, -y] : [y, -x]);
      const pts = local.map(rot).map(([x, y]) => at3(cl + x, cf + y, top, P));
      pins.push(pathOf(pts));
      vias.push(pts[pts.length - 1]);
    }
  }
  const body = solidSvg(extrude(box(die), top, 2.6, P, { bevel: 0.5 }), { tone: "hi", lit: true, className: "fa-gold fa-core wf-core" });
  return pad + lineSvg(pins.join(""), { tone: "lo", className: "wf-trace" }) + `<g class="wf-via">${dotsSvg(vias, { size: 0.5, tone: "hi" })}</g>` + body;
}

/** The USB-B receptacle in a wafer's front edge: a tin-plated shell (a box
    seated in the wafer, standing a little proud of its edge), its plug face
    square with the two top corners cut, the tongue inside carrying four
    contacts, two on its top and two under it. */
const PORT_W = 12;

function portSvg(cl: number, fe: number, z0: number, h: number, P: Projection): string {
  const w = PORT_W;
  const depth = 14;
  const proud = 1.6;
  const ring: Plane[] = [WP(cl - w / 2, fe - depth), WP(cl + w / 2, fe - depth), WP(cl + w / 2, fe + proud), WP(cl - w / 2, fe + proud)];
  const shell = solidSvg(extrude(ring, z0, h, P, { bevel: 0.4 }), { tone: "mid", crease: "lo", className: "wf-shell" });
  // the plug face, on the shell's front plane, in (l, z)
  const fz = fe + proud + 0.05;
  const face = (pts: LF[]) => pts.map(([l, z]) => at3(l, fz, z, P));
  const inset = 1;
  const cut = (w - 2 * inset) * 0.24;
  const L0 = cl - w / 2 + inset;
  const L1 = cl + w / 2 - inset;
  const Z0 = z0 + inset;
  const Z1 = z0 + h - inset;
  const mouth = face([
    [L0, Z0],
    [L1, Z0],
    [L1, Z1 - cut],
    [L1 - cut, Z1],
    [L0 + cut, Z1],
    [L0, Z1 - cut],
  ]);
  const tw = (L1 - L0) * 0.56;
  const th = (Z1 - Z0) * 0.3;
  const tz = Z0 + (Z1 - Z0) * 0.42;
  const tongue = face([
    [cl - tw / 2, tz],
    [cl + tw / 2, tz],
    [cl + tw / 2, tz + th],
    [cl - tw / 2, tz + th],
  ]);
  const contacts: string[] = [];
  const cw = tw * 0.22;
  for (const dl of [-tw * 0.22, tw * 0.22]) {
    for (const [za, zb] of [
      [tz + th, tz + th + 0.7],
      [tz - 0.7, tz],
    ]) {
      contacts.push(polyD(face([[cl + dl - cw / 2, za], [cl + dl + cw / 2, za], [cl + dl + cw / 2, zb], [cl + dl - cw / 2, zb]])));
    }
  }
  return shell + `<path class="wf-mouth" d="${polyD(mouth)}"/><path class="wf-tongue" d="${polyD(tongue)}"/><path class="wf-contact" d="${contacts.join("")}"/>`;
}

interface Feature {
  node?: boolean;
  port?: boolean;
}

function hemisphere(side: Side, view: BrainView, feature: Feature): string {
  const P = projOf(view);
  const [vx, vy] = towardViewer(P);
  const L = LEVELS();
  const wafers: Wafer[] = [];
  for (let k = 0; k < WAFERS; k++) {
    const h0 = L[k];
    const h1 = L[k + 1];
    const raw = sectionAt(side, (h0 + h1) / 2, SHAPE, 200).ring;
    // routed as close as the edge stays a simple loop (a tight route can
    // fold back on itself at a narrow notch)
    let ring = routedOutline(raw, TOL);
    for (let tol = TOL + 0.25; selfCrosses(ring) && tol < TOL + 3; tol += 0.25) ring = routedOutline(raw, tol);
    ring = ring.filter((q, i) => edgeLen(ring, i) > 0.05 || i === 0);
    if (areaOf(ring) < 0) ring = ring.slice().reverse();
    wafers.push({ k, h0, h1, ring });
  }
  // the port: seated in the front edge of two frontal-lobe wafers (k and
  // the one above), facing forward: a level run of the upper wafer's front
  // edge long enough for the shell, with the lower wafer's edge flush under
  // it or a little proud. The lowest such pair above the temporal pole.
  let port: { k: number; l: number; f: number; z0: number; z1: number } | null = null;
  if (feature.port) {
    for (const w of wafers) {
      const up = wafers[w.k + 1];
      if (!up || w.h0 < 0 || up.h1 > 60 || port) continue;
      const n = up.ring.length;
      for (let i = 0; i < n && !port; i++) {
        const a = up.ring[i];
        const b = up.ring[(i + 1) % n];
        const width = PORT_W + 6;
        if (Math.abs(b[1] - a[1]) > 0.01 || edgeLen(up.ring, i) < width || a[1] < HEMI.b * 0.55) continue;
        const l = (a[0] + b[0]) / 2;
        const f = a[1];
        // the lower wafer must reach at least this far forward under it
        if (![l - PORT_W / 2, l + PORT_W / 2].every((x) => inside([x, f - 0.5], w.ring))) continue;
        port = { k: w.k + 1, l, f, z0: w.h0 + GAP + 1, z1: up.h1 - BAND - 1 };
      }
    }
  }
  const out: string[] = [];
  const plane = (ring: readonly LF[]) => ring.map(([l, f]) => WP(l, f));
  for (const w of wafers) {
    const { k, h0, h1, ring } = w;
    const next = wafers[k + 1];
    const below = wafers[k - 1];
    // the bond line, then the body, then the band
    if (k > 0) out.push(solidSvg(extrude(plane(offsetRing(ring, 2.2)), h0, GAP, P, { convex: false }), { tone: "lo", crease: "none", className: "wf-bond" }));
    out.push(solidSvg(extrude(plane(ring), h0 + GAP, h1 - BAND - h0 - GAP, P, { convex: false, bevel: 0.5 }), { tone: "lo", crease: "faint", className: "wf-body" }));
    out.push(solidSvg(extrude(plane(ring), h1 - BAND, BAND, P, { convex: false }), { tone: "lo", crease: "none", className: "wf-band" }));
    if (port && port.k === k) out.push(portSvg(port.l, port.f, port.z0, Math.min(PORT_W * 1.05, port.z1 - port.z0), P));
    // through-silicon vias: a pair of short gold runs down this wafer's
    // edge, from its band to the tread below, each landing on a via there;
    // only on an edge that faces the viewer, over a real tread, where the
    // wafer above does not overhang it
    if (below) {
      const tsv: string[] = [];
      const feet: Flat[] = [];
      const n = ring.length;
      const shelf = offsetRing(below.ring, 1.2);
      for (let i = 0; i < n; i++) {
        if ((i + k * 3) % 9 !== 0) continue;
        const a = ring[i];
        const b = ring[(i + 1) % n];
        const len = edgeLen(ring, i);
        if (len < 12) continue;
        const nx = (b[1] - a[1]) / len;
        const ny = -(b[0] - a[0]) / len;
        // world-plane outward normal (l, f) → (f, −l)
        if (ny * vx + -nx * vy <= 0.3) continue;
        for (const u of [0.42, 0.58]) {
          const q: LF = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
          const foot: LF = [q[0] + nx * 1.8, q[1] + ny * 1.8];
          if (!inside(foot, shelf)) continue;
          if (next && inside([q[0] + nx * 0.5, q[1] + ny * 0.5], next.ring)) continue;
          const p: LF = [q[0] + nx * 0.05, q[1] + ny * 0.05];
          tsv.push(pathOf([at3(p[0], p[1], h1 - BAND, P), at3(p[0], p[1], h0 + GAP, P), at3(foot[0], foot[1], below.h1, P)]));
          feet.push(at3(foot[0], foot[1], below.h1, P));
        }
      }
      if (tsv.length) out.push(lineSvg(tsv.join(""), { tone: "lo", className: "wf-tsv" }) + `<g class="wf-via">${dotsSvg(feet, { size: 0.55, tone: "hi" })}</g>`);
    }
    // the circuits on the tread
    if (next) out.push(treadSvg(side, w, next, P));
    else if (!feature.node) out.push(capDiesSvg(ring, h1, P));
    else {
      const ls = ring.map((p) => p[0]);
      const fs = ring.map((p) => p[1]);
      const ml = (Math.min(...ls) + Math.max(...ls)) / 2;
      const mf = (Math.min(...fs) + Math.max(...fs)) / 2;
      let half = 14;
      const fits = (h: number) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => inside([ml + a * (h + 2), mf + b * (h + 2)], ring));
      while (half > 7 && !fits(half)) half -= 0.5;
      out.push(nodeSvg(ml, mf, h1, half, P));
    }
  }
  return `<g class="wf-hemi">${out.join("")}</g>`;
}

/** The bare cap printed as a whole wafer face: a grid of dies squared to the
    stage, the partial dies at the rim left off (the edge exclusion). */
function capDiesSvg(ring: readonly LF[], z: number, P: Projection): string {
  const keep = offsetRing(ring, 3);
  const ls = ring.map((p) => p[0]);
  const fs = ring.map((p) => p[1]);
  const pitch = DIE_PITCH * 1.25;
  const size = DIE_SIZE * 1.25;
  const lc = (Math.min(...ls) + Math.max(...ls)) / 2;
  const fc = (Math.min(...fs) + Math.max(...fs)) / 2;
  const dies: string[] = [];
  for (let i = -20; i <= 20; i++) {
    for (let j = -30; j <= 30; j++) {
      const l = lc + i * pitch - size / 2;
      const f = fc + j * pitch - size / 2;
      const c: LF[] = [
        [l, f],
        [l + size, f],
        [l + size, f + size],
        [l, f + size],
      ];
      if (!c.every((p) => inside(p, keep))) continue;
      dies.push(polyD(c.map(([a, b]) => at3(a, b, z, P))));
    }
  }
  return dies.length ? `<path class="wf-die" d="${dies.join("")}"/>` : "";
}

/** The printed ring on one wafer's tread: stretches of traces, of dies, of
    parts, or bare, by where they fall round the ring and which wafer. */
function treadSvg(side: Side, w: Wafer, next: Wafer, P: Projection): string {
  const { ring, h1, k } = w;
  const z = h1;
  const n = ring.length;
  const keepOut = offsetRing(next.ring, -1.6);
  const onTread = (p: LF, margin = 0) => inside(p, margin ? offsetRing(ring, margin) : ring) && !inside(p, keepOut);
  const out: string[] = [];
  // the ring's perimeter cut into stretches of about 55 units
  const lens = Array.from({ length: n }, (_, i) => edgeLen(ring, i));
  const total = lens.reduce((s, v) => s + v, 0);
  const stretches = Math.max(3, Math.round(total / 55));
  // u at an arc length along the ring
  const uAt = (s: number) => {
    let x = ((s % total) + total) % total;
    for (let i = 0; i < n; i++) {
      if (x <= lens[i]) return i + x / (lens[i] || 1);
      x -= lens[i];
    }
    return n - 1e-6;
  };
  const traceRuns: string[] = [];
  const vias: Flat[] = [];
  const dies: string[] = [];
  const parts: string[] = [];
  const phase = (k * 23 + (side > 0 ? 11 : 0)) % total;
  for (let sIdx = 0; sIdx < stretches; sIdx++) {
    const pattern = PATTERNS[(sIdx * 3 + k * 5 + (side > 0 ? 2 : 0)) % PATTERNS.length];
    if (pattern === "none") continue;
    const s0 = phase + (total * sIdx) / stretches;
    const s1 = phase + (total * (sIdx + 1)) / stretches;
    if (pattern === "dies") {
      // a die grid squared to the brain's axes over this stretch's reach
      const pitch = DIE_PITCH;
      const size = DIE_SIZE;
      const pts = Array.from({ length: 12 }, (_, i) => pointAt(ring, uAt(s0 + ((s1 - s0) * i) / 11)));
      const ls = pts.map((p) => p[0]);
      const fs = pts.map((p) => p[1]);
      const l0 = Math.floor((Math.min(...ls) - 12) / pitch) * pitch;
      const f0 = Math.floor((Math.min(...fs) - 12) / pitch) * pitch;
      const inStretch = (p: LF) => {
        // nearest ring point's arc length must fall in [s0, s1)
        let best = Infinity;
        let bs = 0;
        let acc = 0;
        for (let i = 0; i < n; i++) {
          const a = ring[i];
          const d = Math.hypot(a[0] - p[0], a[1] - p[1]);
          if (d < best) {
            best = d;
            bs = acc;
          }
          acc += lens[i];
        }
        const rel = (((bs - s0) % total) + total) % total;
        return rel < s1 - s0;
      };
      for (let l = l0; l < Math.max(...ls) + 12; l += pitch) {
        for (let f = f0; f < Math.max(...fs) + 12; f += pitch) {
          const c: LF[] = [
            [l, f],
            [l + size, f],
            [l + size, f + size],
            [l, f + size],
          ];
          if (!c.every((p) => onTread(p, 1.2))) continue;
          if (!inStretch([l + size / 2, f + size / 2])) continue;
          dies.push(polyD(c.map(([a, b]) => at3(a, b, z, P))));
        }
      }
      continue;
    }
    // traces along the tread: up to three, offset in from the edge, over the
    // part of the stretch where the innermost still lies on the tread
    // as many traces as the tread holds here (three, two or one)
    let offs: number[] = [];
    let best: [number, number] | null = null;
    const steps = 40;
    for (const set of [[1.8, 3.4, 5], [1.8, 3.4], [2]]) {
      const inner = offsetRing(ring, set[set.length - 1] + 1);
      let found: [number, number] | null = null;
      let run: number | null = null;
      for (let i = 0; i <= steps; i++) {
        const u = uAt(s0 + ((s1 - s0) * i) / steps);
        const ok = !inside(pointAt(inner, u), keepOut) && inside(pointAt(inner, u), ring);
        if (ok && run === null) run = i;
        if ((!ok || i === steps) && run !== null) {
          const end = ok ? i : i - 1;
          if (!found || end - run > found[1] - found[0]) found = [run, end];
          run = null;
        }
      }
      if (found && found[1] - found[0] >= 14) {
        offs = set;
        best = found;
        break;
      }
    }
    if (!best) continue;
    const sa = s0 + ((s1 - s0) * best[0]) / steps;
    const sb = s0 + ((s1 - s0) * best[1]) / steps;
    offs.forEach((d, j) => {
      const r = offsetRing(ring, d);
      // staggered ends: the inner traces stop shorter
      const ua = uAt(sa + j * 3);
      let ub = uAt(sb - j * 3);
      if (ub <= ua) ub += n;
      const pts = along(r, ua, ub);
      traceRuns.push(pathOf(pts.map(([a, b]) => at3(a, b, z, P))));
      vias.push(at3(pts[0][0], pts[0][1], z, P), at3(pts[pts.length - 1][0], pts[pts.length - 1][1], z, P));
    });
    if (pattern === "parts") {
      // a row of SMD parts inside the traces, squared to the edge there
      const r = offsetRing(ring, offs[offs.length - 1] + 3.2);
      const mid = (sa + sb) / 2;
      for (const ds of [-6, 0, 6]) {
        const u = uAt(mid + ds);
        const p = pointAt(r, u);
        if (!onTread(p, offs[offs.length - 1] + 1.6)) continue;
        const a = pointAt(r, Math.floor(u));
        const b = pointAt(r, Math.floor(u) + 1);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const dx = (b[0] - a[0]) / len;
        const dy = (b[1] - a[1]) / len;
        const hw = 1.6;
        const hd = 1;
        const c: LF[] = [
          [p[0] - dx * hw - dy * hd, p[1] - dy * hw + dx * hd],
          [p[0] + dx * hw - dy * hd, p[1] + dy * hw + dx * hd],
          [p[0] + dx * hw + dy * hd, p[1] + dy * hw - dx * hd],
          [p[0] - dx * hw + dy * hd, p[1] - dy * hw - dx * hd],
        ];
        parts.push(solidSvg(extrude(c.map(([a2, b2]) => WP(a2, b2)), z, 1.1, P, { bevel: 0.2 }), { tone: "mid", crease: "none", className: "wf-part" }));
      }
    }
  }
  if (dies.length) out.push(`<path class="wf-die" d="${dies.join("")}"/>`);
  if (traceRuns.length) out.push(lineSvg(traceRuns.join(""), { tone: "lo", className: "wf-trace" }));
  if (vias.length) out.push(`<g class="wf-via">${dotsSvg(vias, { size: 0.5, tone: "hi" })}</g>`);
  out.push(...parts);
  return out.join("");
}

// ─── the picture ────────────────────────────────────────────────────────────

/** The node on the right crown (the far one in the isometric, so it sits
    high in the picture), the port on the left frontal lobe. */
const NODE_SIDE: Side = 1;
const PORT_SIDE: Side = -1;

function waferSvg({ view, only, light, tones }: MindOptions): string {
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphere(side, view, { node: side === NODE_SIDE, port: side === PORT_SIDE })).join("");
  return mindSvg({ view, light, tones, body, css: sheetOf(light, tones.gold, tones.lit, tones.ground) });
}

export const waferTerraces: MindDirection = {
  id: "f1",
  round: 3,
  name: "Wafer Terraces",
  line: "The keynote's layered brain rebuilt as stacked silicon wafers, its circuits printed on every exposed step.",
  svg: (o) => waferSvg(o),
};


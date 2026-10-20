/* The drum, painted. PURE: returns one SVG string.

   The camera is solved from the reference (`docs/design/machine-mind/round-06/
   wave-6/a0_gpt.png`, 1024²): the anatomy kit's camera at azimuth 90° (plane u
   to screen right, v toward the viewer) and elevation 58°, the drum's top
   centre at (511.94, 373.46) and 1.636 px a mark unit. The silhouette fit and
   its numbers: `docs/design/mark-mind-anatomy/r1/README.md`.

   Painter's order, back to front (each step proved in `mark.ts`'s terms):
     1 the crescent's far half and the top key (the drum hides them)
     2 the upper sectors (their cut faces look down the channels)
     3 the block's seat, inside the notches
     4 the lower sectors
     5 the block's proud cap
     6 the crescent's near half and the right key */

import * as K from "./kit";
import type { P2, Sector } from "./mark";
import { BLOCK_OUTLINE, CROSSING, KEY_RIGHT, KEY_TOP, SECTORS, drumRadius, ringSegments } from "./mark";

export type Stage = "blockout" | "bare" | "full";
export type Cam = "hero" | "top";

export const FRAME = 1024;
export const SLICE = 29;
export const SLICES = 8;
export const H = SLICE * SLICES;
/** The crescent: slices 3 and 4, so its top sits four slices under the drum's. */
export const BELT = { z0: SLICE * 2, z1: SLICE * 4 };
/** The block: seated one slice deep, proud by a quarter slice. */
export const BLOCK_Z = { z0: H - SLICE, top: H, z1: H + 7 };

export const CAMERA = { elevation: 58, cx: 511.94, cy: 373.46, k: 1.636 } as const;
const UNIT = Math.sqrt(1.6); // the kit's k = scale·√1.6

export function projectionOf(cam: Cam, over: { elevation?: number; k?: number; cx?: number; cy?: number } = {}): K.Projection {
  const elevation = cam === "top" ? 90 : (over.elevation ?? CAMERA.elevation);
  const k = over.k ?? CAMERA.k;
  const cx = over.cx ?? CAMERA.cx;
  const cy = cam === "top" ? FRAME / 2 : (over.cy ?? CAMERA.cy);
  const e = (elevation * Math.PI) / 180;
  return { origin: [cx, cy + H * Math.cos(e) * k], scale: k / UNIT, azimuth: 90, elevation };
}

/* ── colour ── */
export const INK = {
  ground: "#070605",
  paper: "#0a0908",
  top: "#0c0b09",
  walls: ["#080706", "#0a0908", "#0d0c0a", "#11100d"],
  bone: "#ddd3c1",
  gold: "#caa554",
  goldTop: "#c29e50",
  goldWalls: ["#3d2f15", "#5a4520", "#7a5f2c", "#9a7a39"],
  lit: "#fff6dc",
  litWalls: ["#b8913f", "#d4ad5c", "#ecc97a", "#f7dc98"],
} as const;

/** Three weights, no more (the weight audit counts them). */
export const WEIGHT = { hair: 0.55, edge: 1, mark: 1.6 } as const;

/* ── a prism of any (convex or concave) plan, face by face ── */
interface FaceStyle {
  /** fill of a visible side face; the outward normal and its two plan ends */
  fill: (n: P2, a: P2, b: P2) => string;
  top: string;
  /** stroke for the top edge a→b, or null for none */
  edge: (a: P2, b: P2) => { tone: string; w: number; alpha?: number } | null;
  /** the verticals on the silhouette, and the bottom edge (or `bottom` when given) */
  rim?: { tone: string; w: number; alpha?: number };
  bottom?: { tone: string; w: number; alpha?: number } | null;
  /** slice lines on the visible faces */
  seams?: { at: number[]; tone: string; w: number; alpha: number; only?: (a: P2, b: P2) => boolean };
  /** a glow wash over chosen faces: opacity 0..1 */
  glow?: (n: P2, a: P2, b: P2) => number;
  /** a glow wash over the top */
  glowTop?: number;
}

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const pathOf = (pts: K.Flat[], closed = false) => (pts.length ? pts.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join("") + (closed ? "Z" : "") : "");
const stroke = (d: string, s: { tone: string; w: number; alpha?: number }, extra = "") =>
  d ? `<path d="${d}" fill="none" stroke="${s.tone}" stroke-width="${s.w}"${s.alpha !== undefined && s.alpha < 1 ? ` stroke-opacity="${f1(s.alpha * 100) === "0" ? 0 : (Math.round(s.alpha * 100) / 100).toString()}"` : ""} vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"${extra}/>` : "";
const fillPath = (d: string, fill: string, extra = "") => (d ? `<path d="${d}" fill="${fill}"${extra}/>` : "");

function ccw(ring: P2[]): P2[] {
  return K.signedArea(ring) > 0 ? ring : [...ring].reverse();
}
/** Outward normal of edge a→b of a ring wound as `ccw` returns (y down: area > 0). */
const outwardOf = (a: P2, b: P2): P2 => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dy / l, -dx / l];
};

export function prismSvg(plan: P2[], z0: number, z1: number, P: K.Projection, style: FaceStyle): string {
  const ring = ccw(plan);
  const n = ring.length;
  const at = (p: P2, z: number) => K.iso([p[0], p[1], z], P);
  const view = K.towardViewer(P);
  const faces: { i: number; a: P2; b: P2; nrm: P2; depth: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const nrm = outwardOf(a, b);
    if (nrm[0] * view[0] + nrm[1] * view[1] <= 1e-9) continue;
    faces.push({ i, a, b, nrm, depth: K.depthOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2], P) });
  }
  faces.sort((p, q) => p.depth - q.depth);
  const out: string[] = [];
  const top = ring.map((p) => at(p, z1));
  const bottom = ring.map((p) => at(p, z0));
  // paper under everything: the top, the bottom and each visible face
  const paper = [pathOf(top, true), pathOf(bottom, true), ...faces.map((f) => pathOf([at(f.a, z1), at(f.b, z1), at(f.b, z0), at(f.a, z0)], true))].join("");
  out.push(fillPath(paper, INK.paper));
  if (z1 > z0 + 1e-6 && Math.abs(P.elevation ?? 30) < 89.9) {
    for (const f of faces) {
      const d = pathOf([at(f.a, z1), at(f.b, z1), at(f.b, z0), at(f.a, z0)], true);
      const c = style.fill(f.nrm, f.a, f.b);
      out.push(`<path d="${d}" fill="${c}" stroke="${c}" stroke-width="0.4"/>`);
      const g = style.glow?.(f.nrm, f.a, f.b) ?? 0;
      if (g > 0.01) out.push(fillPath(d, "url(#glow)", ` opacity="${(Math.round(g * 100) / 100).toString()}"`));
    }
    if (style.seams) {
      const s = style.seams;
      const lines: string[] = [];
      for (const f of faces) {
        if (s.only && !s.only(f.a, f.b)) continue;
        for (const z of s.at) if (z > z0 + 0.01 && z < z1 - 0.01) lines.push(pathOf([at(f.a, z), at(f.b, z)]));
      }
      out.push(stroke(lines.join(""), s));
    }
  }
  out.push(`<path d="${pathOf(top, true)}" fill="${style.top}"/>`);
  if (style.glowTop && style.glowTop > 0.01) out.push(fillPath(pathOf(top, true), "url(#glow)", ` opacity="${style.glowTop}"`));
  // edges: the top ring, edge by edge in its own tone
  const byTone = new Map<string, { s: { tone: string; w: number; alpha?: number }; d: string[] }>();
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const s = style.edge(a, b);
    if (!s) continue;
    const key = `${s.tone}|${s.w}|${s.alpha ?? 1}`;
    if (!byTone.has(key)) byTone.set(key, { s, d: [] });
    byTone.get(key)!.d.push(pathOf([top[i]!, top[(i + 1) % n]!]));
  }
  if (style.rim && z1 > z0 + 1e-6 && Math.abs(P.elevation ?? 30) < 89.9) {
    const rimD: string[] = [];
    const bottomD: string[] = [];
    const facing = new Set(faces.map((f) => f.i));
    for (const f of faces) bottomD.push(pathOf([at(f.a, z0), at(f.b, z0)]));
    for (let i = 0; i < n; i++) {
      const prev = (i + n - 1) % n;
      if (facing.has(prev) !== facing.has(i)) rimD.push(pathOf([at(ring[i]!, z1), at(ring[i]!, z0)]));
    }
    out.push(stroke(rimD.join(""), style.rim));
    if (style.bottom !== null) out.push(stroke(bottomD.join(""), style.bottom ?? style.rim));
  }
  for (const { s, d } of byTone.values()) out.push(stroke(d.join(""), s));
  return out.join("");
}

/* ── the pieces ── */
const onRim = (a: P2, b: P2) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  return Math.hypot(mx, my) > drumRadius(Math.atan2(my, mx)) - 0.6;
};

/** The kit's four tones by facing, its light from the left and a little behind. */
const LIGHT: P2 = (() => {
  const t = (200 * Math.PI) / 180;
  return [Math.cos(t), Math.sin(t)];
})();
const toneIndex = (n: P2) => Math.min(3, Math.max(0, Math.floor(((n[0] * LIGHT[0] + n[1] * LIGHT[1] + 1) / 2) * 4)));

/** How much a face at plan point p with outward normal n faces the block, 0..1. */
function facesBlock(n: P2, a: P2, b: P2) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = CROSSING[0] - mx;
  const dy = CROSSING[1] - my;
  const d = Math.hypot(dx, dy) || 1;
  return Math.max(0, (n[0] * dx + n[1] * dy) / d);
}

function sectorSvg(sec: Sector, P: K.Projection, stage: Stage, part: "base" | "top", diag = false): string {
  const bone = (alpha: number, w: number = WEIGHT.edge) => ({ tone: INK.bone, w, alpha });
  const gold = (alpha: number, w: number = WEIGHT.edge) => ({ tone: INK.gold, w, alpha });
  const seamsAt = Array.from({ length: SLICES - 1 }, (_, i) => (i + 1) * SLICE);
  const style: FaceStyle = {
    fill: (n, a, b) => (onRim(a, b) ? INK.walls[toneIndex(n)]! : INK.walls[1]!),
    top: diag ? "#0000ff" : INK.top,
    edge:
      part === "base"
        ? () => null
        : (a, b) => (onRim(a, b) ? bone(stage === "blockout" ? 0.75 : 0.62) : gold(0.95, WEIGHT.edge)),
    rim: stage === "blockout" ? bone(0.5) : bone(0.42),
    bottom: part === "top" ? (stage === "blockout" ? null : { tone: INK.bone, w: WEIGHT.hair, alpha: 0.32 }) : undefined,
    seams: stage === "blockout" ? undefined : { at: seamsAt, tone: INK.bone, w: WEIGHT.hair, alpha: 0.32 },
    glow: stage === "blockout" ? undefined : (n, a, b) => (onRim(a, b) ? 0 : 0.25 + 0.75 * facesBlock(n, a, b)),
  };
  return part === "base" ? prismSvg(sec.base, 0, BLOCK_Z.z0, P, style) : prismSvg(sec.topRing, BLOCK_Z.z0, H, P, style);
}

interface Seg {
  poly: P2[];
  t: number;
}
/** The crescent, split at v = 0 into far and near halves; each half is its
    segments' fills (seamless) plus one continuous outline. */
function crescentSvg(segs: Seg[], P: K.Projection, stage: Stage, half: "far" | "near"): string {
  const mine = segs.filter((s) => (half === "far" ? Math.sin(s.t) < 0 : Math.sin(s.t) >= 0));
  mine.sort((p, q) => K.depthOf([Math.cos(p.t) * 200, Math.sin(p.t) * 200, 0], P) - K.depthOf([Math.cos(q.t) * 200, Math.sin(q.t) * 200, 0], P));
  const out: string[] = [];
  const view = K.towardViewer(P);
  const flat = Math.abs(P.elevation ?? 30) >= 89.9;
  for (const s of mine) {
    const sp = K.extrude(s.poly, BELT.z0, BELT.z1 - BELT.z0, P);
    // one tone a segment, from its outer face's normal, so the band reads as one turned body
    const nrm: P2 = [Math.cos(s.t), Math.sin(s.t)];
    const tone = INK.goldWalls[toneIndex(nrm)]!;
    out.push(`<path d="${sp.fill}" fill="${tone}" stroke="${tone}" stroke-width="0.5"/>`);
    const topD = sp.top;
    out.push(`<path d="${topD}" fill="${INK.goldTop}" stroke="${INK.goldTop}" stroke-width="0.5"/>`);
    void view;
  }
  // outline: the outer and inner top arcs, the outer bottom arc where it faces you, the cut ends
  const runs: Seg[][] = [];
  for (const s of [...mine].sort((p, q) => ((p.t + 2 * Math.PI) % (2 * Math.PI)) - ((q.t + 2 * Math.PI) % (2 * Math.PI)))) {
    const last = runs[runs.length - 1];
    const prev = last?.[last.length - 1];
    const gap = prev ? Math.abs(Math.atan2(Math.sin(s.t - prev.t), Math.cos(s.t - prev.t))) : 9;
    if (last && gap < 0.05) last.push(s);
    else runs.push([s]);
  }
  // join a run that wraps through angle 0
  if (runs.length > 1) {
    const a = runs[0]![0]!;
    const z = runs[runs.length - 1]![runs[runs.length - 1]!.length - 1]!;
    if (Math.abs(Math.atan2(Math.sin(a.t - z.t), Math.cos(a.t - z.t))) < 0.05) runs[0] = [...runs.pop()!, ...runs[0]!];
  }
  const lines: string[] = [];
  const bottomLines: string[] = [];
  for (const run of runs) {
    // each segment's polygon is [outer…, inner… reversed]
    const outerPts: P2[] = [];
    const innerPts: P2[] = [];
    for (const s of run) {
      const half2 = s.poly.length / 2;
      outerPts.push(...s.poly.slice(0, half2));
      innerPts.push(...s.poly.slice(half2).reverse());
    }
    lines.push(pathOf(outerPts.map((p) => K.iso([p[0], p[1], BELT.z1], P))));
    lines.push(pathOf(innerPts.map((p) => K.iso([p[0], p[1], BELT.z1], P))));
    const o0 = outerPts[0]!;
    const i0 = innerPts[0]!;
    const o1 = outerPts[outerPts.length - 1]!;
    const i1 = innerPts[innerPts.length - 1]!;
    lines.push(pathOf([K.iso([o0[0], o0[1], BELT.z1], P), K.iso([i0[0], i0[1], BELT.z1], P)]));
    lines.push(pathOf([K.iso([o1[0], o1[1], BELT.z1], P), K.iso([i1[0], i1[1], BELT.z1], P)]));
    if (!flat) {
      // the outer bottom edge and the silhouette verticals, where the outer face turns to you
      let cur: K.Flat[] = [];
      for (const p of outerPts) {
        const t = Math.atan2(p[1], p[0]);
        const facing = Math.cos(t) * view[0] + Math.sin(t) * view[1] > 0;
        if (facing) cur.push(K.iso([p[0], p[1], BELT.z0], P));
        else if (cur.length) {
          bottomLines.push(pathOf(cur));
          const q = cur[cur.length - 1]!;
          bottomLines.push(pathOf([q, [q[0], q[1] - (BELT.z1 - BELT.z0) * Math.cos(((P.elevation ?? 30) * Math.PI) / 180) * P.scale * UNIT]]));
          cur = [];
        }
      }
      if (cur.length) bottomLines.push(pathOf(cur));
      // the cut ends' verticals
      for (const p of [o0, o1]) {
        const t = Math.atan2(p[1], p[0]);
        if (Math.cos(t) * view[0] + Math.sin(t) * view[1] > -0.2) bottomLines.push(pathOf([K.iso([p[0], p[1], BELT.z1], P), K.iso([p[0], p[1], BELT.z0], P)]));
      }
    }
  }
  const w = stage === "blockout" ? WEIGHT.edge : WEIGHT.edge;
  out.push(stroke(lines.join(""), { tone: INK.gold, w }));
  out.push(stroke(bottomLines.join(""), { tone: INK.gold, w, alpha: 0.7 }));
  return out.join("");
}

function goldPrism(plan: P2[], z0: number, z1: number, P: K.Projection) {
  return prismSvg(plan, z0, z1, P, {
    fill: (n) => INK.goldWalls[toneIndex(n)]!,
    top: INK.goldTop,
    edge: () => ({ tone: INK.gold, w: WEIGHT.edge }),
    rim: { tone: INK.gold, w: WEIGHT.edge, alpha: 0.7 },
  });
}

function blockSvg(P: K.Projection, z0: number, z1: number, stage: Stage) {
  return prismSvg(BLOCK_OUTLINE, z0, z1, P, {
    fill: (n) => INK.litWalls[toneIndex(n)]!,
    top: INK.lit,
    edge: () => ({ tone: stage === "blockout" ? INK.gold : "#fff1c8", w: WEIGHT.edge }),
    rim: { tone: "#fff1c8", w: WEIGHT.edge, alpha: 0.8 },
  });
}

export interface SceneOptions {
  stage: Stage;
  cam: Cam;
  /** overrides for the camera solve */
  over?: { elevation?: number; k?: number; cx?: number; cy?: number };
  /** drop the mark (the integration check: no mark, no sectors) */
  noMark?: boolean;
  /** sector tops in flat blue, for the checks to find them */
  diag?: boolean;
  /** the mark alone, the drum left out (to measure what the drum hides) */
  solo?: boolean;
}

export function sceneSvg({ stage, cam, over, noMark, diag, solo }: SceneOptions): { svg: string; P: K.Projection } {
  const P = projectionOf(cam, over);
  const segs = ringSegments(2, 4);
  const body: string[] = [];
  const blockTop = K.iso([CROSSING[0], CROSSING[1], BLOCK_Z.z1], P);

  if (noMark) {
    // the drum without its mark: one plain prism, no cut, no sector
    const style: FaceStyle = {
      fill: (n) => INK.walls[toneIndex(n)]!,
      top: diag ? "#0000ff" : INK.top,
      edge: () => ({ tone: INK.bone, w: WEIGHT.edge, alpha: 0.62 }),
      rim: { tone: INK.bone, w: WEIGHT.edge, alpha: 0.42 },
      seams: stage === "blockout" ? undefined : { at: Array.from({ length: SLICES - 1 }, (_, i) => (i + 1) * SLICE), tone: INK.bone, w: WEIGHT.hair, alpha: 0.32 },
    };
    const drumPlan = Array.from({ length: 240 }, (_, i) => {
      const t = (i / 240) * Math.PI * 2;
      const r = drumRadius(t);
      return [Math.cos(t) * r, Math.sin(t) * r] as P2;
    });
    body.push(prismSvg(drumPlan, 0, H, P, style));
  } else {
    body.push(`<g data-part="crescent-far">${crescentSvg(segs, P, stage, "far")}</g>`);
    body.push(`<g data-part="key-top">${goldPrism(KEY_TOP, BELT.z0, BELT.z1, P)}</g>`);
    const by = (k: string) => SECTORS.find((s) => s.key === k)!;
    const sector = (k: string) => (solo ? "" : `<g data-part="sector-${k}">${sectorSvg(by(k), P, stage, "base", diag)}${sectorSvg(by(k), P, stage, "top", diag)}</g>`);
    for (const k of ["ur", "ul"]) body.push(sector(k));
    body.push(`<g data-part="block-seat">${blockSvg(P, BLOCK_Z.z0, BLOCK_Z.top, stage)}</g>`);
    for (const k of ["lr", "ll"]) body.push(sector(k));
    body.push(`<g data-part="block-cap">${blockSvg(P, BLOCK_Z.top, BLOCK_Z.z1, stage)}</g>`);
    body.push(`<g data-part="crescent-near">${crescentSvg(segs, P, stage, "near")}</g>`);
    body.push(`<g data-part="key-right">${goldPrism(KEY_RIGHT, BELT.z0, BELT.z1, P)}</g>`);
  }

  const glowR = 330;
  const defs = `<defs><radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="${f1(blockTop[0])}" cy="${f1(blockTop[1])}" r="${glowR}">
<stop offset="0" stop-color="#ffe3a6" stop-opacity="0.85"/><stop offset="0.12" stop-color="#f3c66e" stop-opacity="0.42"/><stop offset="0.35" stop-color="#caa554" stop-opacity="0.12"/><stop offset="1" stop-color="#caa554" stop-opacity="0"/></radialGradient>
<radialGradient id="bloom" gradientUnits="userSpaceOnUse" cx="${f1(blockTop[0])}" cy="${f1(blockTop[1])}" r="150">
<stop offset="0" stop-color="#fff2cf" stop-opacity="0.55"/><stop offset="0.2" stop-color="#f6cf7d" stop-opacity="0.18"/><stop offset="1" stop-color="#caa554" stop-opacity="0"/></radialGradient></defs>`;
  const bloom = stage === "blockout" || noMark ? "" : `<circle cx="${f1(blockTop[0])}" cy="${f1(blockTop[1])}" r="150" fill="url(#bloom)" style="mix-blend-mode:screen"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FRAME} ${FRAME}" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" data-stage="${stage}" data-cam="${cam}">${defs}${body.join("")}${bloom}</svg>`;
  return { svg, P };
}

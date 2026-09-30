/**
 * aboutTurnGate — the About orbit's drawing BECOMES the corridor's compass
 * gate (ADR-137 U3). Owner, 2026-09-30: "a nice, elegant transition from the
 * diagrams behind my profile picture into the diagrams of the brandmark
 * gateway … no cross-dissolve, but something that really uses an SVG
 * animation to have those elements transition."
 *
 * ONE SVG LAYER IN THE STAGE, ONE MORPH PER PART, NOTHING FADES:
 *   · four of the six rings SQUARE UP into the gate's four portal loops,
 *     each turning as it goes (alternate directions, like the About's own
 *     counter-rotating orbits), its centre gliding from the portrait onto
 *     the mark, its ink, width and dash easing onto the gate's;
 *   · the other two rings and the four spokes DRAW IN to the mark's centre;
 *   · the four cardinal ticks slide onto the gate's bearing stubs, the eight
 *     30°-family ticks onto its eight ticks (they are the same eight angles),
 *     and the other twelve retract into the frame;
 *   · the five orbit nodes SPIRAL onto the gate's three phase dots and two
 *     orbit dots, squaring or rounding on the way;
 *   · the three connectors draw on from their dots.
 *   The corner readouts decode into NAVIGATE · ENCODE · BUILD in the carrier
 *   (they are text), and the lettering inside the SVG scrambles out here.
 *
 * ⚠ THE LANDING IS THE LIVE GATE'S OWN PIXELS, READ EVERY FRAME. The gate
 * breathes (a slow Z spin), its orbit dots turn and its centre rides a
 * follower, so `ThoughtformCompassGate` publishes its projected points into
 * `compassGateScreenRef` while this route asks, and every end state below is
 * that frame's.
 *
 * ⚠ THE HAND-OVER IS THE OPENING, NOT A SWAP. This layer is masked with the
 * SAME square aperture as About's ground (route rule 1b): it draws where the
 * ground still stands and the live gate shows where the ground has opened.
 * Both are the same lines on the same pixels, so the opening sweeps the
 * hand-over out with it and no frame shows two gates or none.
 *
 * ⚠ THE GATE'S INK IS MULTIPLIED BY ALPHA TWICE (the canvas is
 * `premultipliedAlpha: false`), so the end ink is `compassGateInk`, never
 * the hex at the material's opacity. And a WebGL line is one drawing-buffer
 * pixel, so the end width is `1 / dpr` CSS px.
 *
 * DOM-only, no three: the geometry arrives as numbers.
 */

import {
  COMPASS_GATE_DAWN,
  COMPASS_ORBIT_INK,
  COMPASS_GATE_GOLD,
  COMPASS_RING_DASH,
  COMPASS_RING_INK,
  compassGateInk,
  type CompassGateScreen,
} from "@/components/landing/home-v2/compassGateScreenRef";
import { scrambleLinesOut } from "@/lib/home-v2/scrubbedDecode";

import {
  CONNECTORS_DRAW,
  CORE_IN,
  NODES_MORPH,
  RINGS_MORPH,
  SVG_TEXT_OUT,
  TICKS_MORPH,
  circleAtAngles,
  closedPath,
  easedWindow,
  quadCentre,
  reseat,
  sampleQuad,
  spiralPoint,
  windowOf,
  type Pt,
} from "./aboutTurnClock";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Points per quad edge, 128 around a loop. The START circle is sampled at
 *  the square's point angles, which bunch at the corners and open to ~3.6°
 *  mid-edge at this count: 0.12px of sagitta on the largest ring. At 16 per
 *  edge it was 7.2° and 0.5px, and the replica read as a slightly different
 *  circle from the one it replaces. */
const PER_EDGE = 32;
/** Points around a collapsing ring or a node. */
const CORE_SAMPLES = 96;
const NODE_SAMPLES = 16;

/** The About ring → gate loop map, by the About ring's radius (viewBox
 *  units): same inks and near-same dashes, outermost first. */
const RING_TO_GATE: Readonly<Record<number, number>> = { 192: 0, 172: 1, 150: 2, 104: 3 };
/** The turn each ring carries as it squares up, radians — alternating, the
 *  outermost turning furthest. */
const RING_TWIST = [0.5, -0.42, 0.34, -0.26] as const;
/** The turn the collapsing rings and spokes carry into the mark. */
const CORE_TWIST = 0.9;

/** The About's 20 minor ticks by their `rotate()` angle → the gate's tick
 *  index. The gate's ticks sit at 30/60/120/150/210/240/300/330° measured
 *  counter-clockwise from +x with y up; an SVG `rotate(a)` of the up vector
 *  points at 90° − a on that dial, so these eight are the SAME angles. */
const TICK_TO_GATE: Readonly<Record<number, number>> = {
  60: 0,
  30: 1,
  330: 2,
  300: 3,
  240: 4,
  210: 5,
  150: 6,
  120: 7,
};

/** Node (DOM order in the three rotating groups) → its gate target. */
const NODE_TO_GATE: readonly { kind: "phase" | "orbit"; i: number }[] = [
  { kind: "phase", i: 0 }, // gold dot, r 150 → NAVIGATE
  { kind: "phase", i: 1 }, // gold diamond, r 150 → ENCODE
  { kind: "orbit", i: 1 }, // dawn dot, r 172 → the dawn orbit dot
  { kind: "phase", i: 2 }, // dawn dot, r 172 → BUILD
  { kind: "orbit", i: 0 }, // gold dot, r 124 → the gold orbit dot
];

interface Ink {
  rgb: [number, number, number];
  a: number;
}

function parseInk(color: string, alpha: number): Ink {
  const m = /rgba?\(([^)]+)\)/.exec(color);
  if (!m) return { rgb: [0, 0, 0], a: 0 };
  const parts = m[1]!
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  const a = parts.length > 3 ? parts[3]! : 1;
  return { rgb: [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0], a: a * alpha };
}

function inkAt(a: Ink, b: Ink, e: number): { color: string; opacity: string } {
  const r = a.rgb[0] + (b.rgb[0] - a.rgb[0]) * e;
  const g = a.rgb[1] + (b.rgb[1] - a.rgb[1]) * e;
  const bl = a.rgb[2] + (b.rgb[2] - a.rgb[2]) * e;
  const op = a.a + (b.a - a.a) * e;
  return {
    color: `rgb(${r.toFixed(1)}, ${g.toFixed(1)}, ${bl.toFixed(1)})`,
    opacity: op.toFixed(4),
  };
}

function gateInk(hex: string, a: number): Ink {
  const k = compassGateInk(hex, a);
  return { rgb: k.rgb, a: k.a };
}

const lerp = (a: number, b: number, e: number) => a + (b - a) * e;

interface RingPart {
  el: SVGPathElement;
  radius: number;
  gate: number;
  twist: number;
  ink: Ink;
  width: number;
  dash: [number, number] | null;
}

interface CorePart {
  el: SVGPathElement;
  radius: number;
  twist: number;
}

interface SegPart {
  el: SVGLineElement;
  /** Start endpoints, stage px: the OUTER end first. */
  outer: Pt;
  inner: Pt;
  target: { kind: "cross" | "tick"; i: number } | { kind: "retract" } | { kind: "core" };
  ink: Ink;
  width: number;
}

interface NodePart {
  el: SVGPathElement;
  src: SVGGraphicsElement;
  target: { kind: "phase" | "orbit"; i: number };
  ink: Ink;
}

export interface GateMeasure {
  layer: SVGSVGElement;
  /** The About orbit's centre, stage px. */
  centre: Pt;
  rings: RingPart[];
  cores: CorePart[];
  segs: SegPart[];
  nodes: NodePart[];
  conns: SVGLineElement[];
  texts: SVGTextElement[];
  finals: string[];
  stageLeft: number;
  stageTop: number;
}

function make<K extends keyof SVGElementTagNameMap>(
  layer: SVGSVGElement,
  tag: K
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  el.setAttribute("fill", "none");
  el.setAttribute("stroke-linecap", "butt");
  layer.appendChild(el);
  return el;
}

function pointsOfPath(path: SVGPathElement): [number, number][] {
  const nums = (path.getAttribute("d") ?? "").match(/-?[\d.]+/g)?.map(Number) ?? [];
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i]!, nums[i + 1]!]);
  return out;
}

/**
 * Read the About orbit's drawing (stage px, at rest) and build the layer's
 * parts. Returns null if the drawing is not the one this morph was written
 * for — the turn then simply keeps the About's own drawing.
 * ⚠ REBUILDS THE LAYER'S CHILDREN.
 */
export function measureGate(
  layer: SVGSVGElement,
  about: SVGSVGElement,
  stageBox: DOMRect
): GateMeasure | null {
  const ctm = about.getScreenCTM();
  if (!ctm) return null;
  const toStage = (m: DOMMatrix, x: number, y: number): [number, number] => {
    const p = new DOMPoint(x, y).matrixTransform(m);
    return [p.x - stageBox.left, p.y - stageBox.top];
  };
  const scale = Math.hypot(ctm.a, ctm.b);
  const centre = toStage(ctm, 0, 0);
  layer.replaceChildren();

  const rings: RingPart[] = [];
  const cores: CorePart[] = [];
  for (const c of about.querySelectorAll<SVGCircleElement>('[data-tw-part="rings"] circle')) {
    const r = Number(c.getAttribute("r"));
    const cs = getComputedStyle(c);
    const ink = parseInk(cs.stroke, parseFloat(cs.strokeOpacity) || 1);
    const width = (parseFloat(cs.strokeWidth) || 0.7) * scale;
    const dashAttr = c.getAttribute("stroke-dasharray");
    const dash = dashAttr
      ? (dashAttr.split(/[\s,]+/).map((v) => Number(v) * scale) as [number, number])
      : null;
    const el = make(layer, "path");
    el.setAttribute("stroke-width", width.toFixed(3));
    if (dash) el.setAttribute("stroke-dasharray", `${dash[0].toFixed(2)} ${dash[1].toFixed(2)}`);
    const k = inkAt(ink, ink, 0);
    el.setAttribute("stroke", k.color);
    el.setAttribute("stroke-opacity", k.opacity);
    const gate = RING_TO_GATE[r];
    if (gate === undefined) {
      cores.push({ el, radius: r * scale, twist: cores.length % 2 ? -CORE_TWIST : CORE_TWIST });
    } else {
      rings.push({ el, radius: r * scale, gate, twist: RING_TWIST[gate]!, ink, width, dash });
    }
  }
  if (rings.length !== 4) {
    layer.replaceChildren();
    return null;
  }

  const segs: SegPart[] = [];
  const addSeg = (path: SVGPathElement, target: SegPart["target"]) => {
    const m = path.getScreenCTM();
    const pts = pointsOfPath(path);
    if (!m || pts.length < 2) return;
    const a = toStage(m, pts[0]![0], pts[0]![1]);
    const b = toStage(m, pts[1]![0], pts[1]![1]);
    const da = Math.hypot(a[0] - centre[0], a[1] - centre[1]);
    const db = Math.hypot(b[0] - centre[0], b[1] - centre[1]);
    const cs = getComputedStyle(path);
    const ink = parseInk(cs.stroke, parseFloat(cs.strokeOpacity) || 1);
    const width = (parseFloat(cs.strokeWidth) || 0.5) * scale;
    const el = make(layer, "line");
    el.setAttribute("stroke-width", width.toFixed(3));
    segs.push({
      el,
      outer: da >= db ? a : b,
      inner: da >= db ? b : a,
      target,
      ink,
      width,
    });
  };
  about
    .querySelectorAll<SVGPathElement>('[data-tw-part="cardinal"] path')
    .forEach((p, i) => addSeg(p, { kind: "cross", i }));
  about.querySelectorAll<SVGPathElement>('[data-tw-part="ticks"] path').forEach((p) => {
    const rot = /rotate\((-?[\d.]+)/.exec(p.getAttribute("transform") ?? "");
    const deg = rot ? Math.round(Number(rot[1])) % 360 : 0;
    const gate = TICK_TO_GATE[deg];
    addSeg(p, gate === undefined ? { kind: "retract" } : { kind: "tick", i: gate });
  });
  about
    .querySelectorAll<SVGPathElement>('[data-tw-part="spokes"] path')
    .forEach((p) => addSeg(p, { kind: "core" }));

  const nodes: NodePart[] = [];
  about
    .querySelectorAll<SVGGraphicsElement>('[data-tw-part="nodes"] :is(circle, rect)')
    .forEach((src, i) => {
      const target = NODE_TO_GATE[i];
      if (!target) return;
      const cs = getComputedStyle(src);
      const ink = parseInk(
        cs.fill,
        (parseFloat(cs.fillOpacity) || 1) * (parseFloat(cs.opacity) || 1)
      );
      const el = make(layer, "path");
      el.setAttribute("stroke", "none");
      nodes.push({ el, src, target, ink });
    });

  const conns = [0, 1, 2].map(() => make(layer, "line"));
  const texts = Array.from(about.querySelectorAll<SVGTextElement>('[data-tw-part="text"] text'));
  return {
    layer,
    centre,
    rings,
    cores,
    segs,
    nodes,
    conns,
    texts,
    finals: texts.map((t) => t.textContent ?? ""),
    stageLeft: stageBox.left,
    stageTop: stageBox.top,
  };
}

function setLine(el: SVGLineElement, a: Pt, b: Pt): void {
  el.setAttribute("x1", a[0].toFixed(2));
  el.setAttribute("y1", a[1].toFixed(2));
  el.setAttribute("x2", b[0].toFixed(2));
  el.setAttribute("y2", b[1].toFixed(2));
}

function setInk(el: SVGElement, ink: { color: string; opacity: string }, fill = false): void {
  el.setAttribute(fill ? "fill" : "stroke", ink.color);
  el.setAttribute(fill ? "fill-opacity" : "stroke-opacity", ink.opacity);
}

/**
 * One frame at turn clock `u`. `f` is the live gate's screen frame, `off`
 * the canvas's offset in stage px, `mark` the live mark's centre in stage px.
 */
export function writeGate(
  m: GateMeasure,
  u: number,
  f: CompassGateScreen,
  off: Pt,
  mark: Pt
): void {
  const at = (arr: readonly number[], i: number): [number, number] => [
    arr[i]! + off[0],
    arr[i + 1]! + off[1],
  ];
  const lineW = 1 / (f.dpr || 1);
  const S = m.centre;
  const q0 = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => f.rings[i]! + off[i % 2]!);
  const G = quadCentre(q0);

  /* Rings → portal loops. */
  const eRing = easedWindow(u, RINGS_MORPH);
  for (const ring of m.rings) {
    const q = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => f.rings[ring.gate * 8 + i]! + off[i % 2]!);
    const ends = sampleQuad(q, PER_EDGE);
    const gc = quadCentre(q);
    const starts = circleAtAngles(S, ring.radius, ends, gc, ring.twist);
    const pts = ends.map((end, k) => spiralPoint(S, starts[k]!, gc, end, eRing));
    const gd = COMPASS_RING_DASH[ring.gate];
    if (ring.dash && gd) {
      /* ⚠ THE DASH SEAM TRAVELS. A dashed loop's pattern wraps once, at its
         start: an SVG circle's at 3 o'clock, the gate's WebGL loop's at its
         top-left corner. So the path is re-started at the circle's seam at
         the start of the morph and slides it round to the gate's by the end
         — the dashes flow round the ring as it winds into the square, and
         match their source at both ends. (Offsetting a fixed start instead
         lands the pattern on one arc and two pixels off on the other.) */
      const a0 = Math.atan2(starts[0]![1] - S[1], starts[0]![0] - S[0]);
      const f0 = ((((0 - a0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
      const f1 = f0 > 0.5 ? 1 : 0;
      ring.el.setAttribute("d", closedPath(reseat(pts, lerp(f0, f1, eRing))));
    } else {
      ring.el.setAttribute("d", closedPath(pts));
    }
    setInk(
      ring.el,
      inkAt(ring.ink, gateInk(COMPASS_RING_INK[ring.gate]!, f.ringAlpha[ring.gate] ?? 0), eRing)
    );
    ring.el.setAttribute("stroke-width", lerp(ring.width, lineW, eRing).toFixed(3));
    if (ring.dash && gd) {
      ring.el.setAttribute(
        "stroke-dasharray",
        `${lerp(ring.dash[0], gd.dashSize * f.unitPx, eRing).toFixed(2)} ${lerp(ring.dash[1], gd.gapSize * f.unitPx, eRing).toFixed(2)}`
      );
    }
  }

  /* The two left over, drawing in to the mark's centre. */
  const eCore = easedWindow(u, CORE_IN);
  for (const core of m.cores) {
    const r = core.radius * (1 - eCore);
    if (r < 0.75) {
      core.el.setAttribute("d", "");
      continue;
    }
    const cx = lerp(S[0], mark[0], eCore);
    const cy = lerp(S[1], mark[1], eCore);
    const pts: Pt[] = [];
    for (let k = 0; k < CORE_SAMPLES; k++) {
      const a = (k / CORE_SAMPLES) * 2 * Math.PI + core.twist * eCore;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    core.el.setAttribute("d", closedPath(pts));
  }

  /* Ticks and spokes. */
  const eTick = easedWindow(u, TICKS_MORPH);
  const bearing = gateInk(COMPASS_GATE_DAWN, f.bearingAlpha);
  const apothem = 0.75 * f.unitPx;
  for (const seg of m.segs) {
    const t = seg.target;
    if (t.kind === "core") {
      const shrink = 1 - eCore;
      const cx = lerp(S[0], mark[0], eCore);
      const cy = lerp(S[1], mark[1], eCore);
      const turn = CORE_TWIST * eCore;
      const rot = (p: Pt): Pt => {
        const dx = (p[0] - S[0]) * shrink;
        const dy = (p[1] - S[1]) * shrink;
        return [
          cx + dx * Math.cos(turn) - dy * Math.sin(turn),
          cy + dx * Math.sin(turn) + dy * Math.cos(turn),
        ];
      };
      const a = rot(seg.outer);
      const b = rot(seg.inner);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5) {
        seg.el.setAttribute("visibility", "hidden");
        continue;
      }
      seg.el.removeAttribute("visibility");
      setLine(seg.el, a, b);
      setInk(seg.el, inkAt(seg.ink, seg.ink, 0));
      continue;
    }
    let outer: Pt;
    let inner: Pt;
    if (t.kind === "retract") {
      const ang = Math.atan2(seg.outer[1] - S[1], seg.outer[0] - S[0]);
      const dest: Pt = [G[0] + apothem * Math.cos(ang), G[1] + apothem * Math.sin(ang)];
      outer = spiralPoint(S, seg.outer, G, dest, eTick);
      inner = spiralPoint(S, seg.inner, G, dest, eTick);
    } else {
      const src = t.kind === "cross" ? f.cross : f.ticks;
      const endInner = at(src, t.i * 4);
      const endOuter = at(src, t.i * 4 + 2);
      outer = spiralPoint(S, seg.outer, G, endOuter, eTick);
      inner = spiralPoint(S, seg.inner, G, endInner, eTick);
    }
    if (Math.hypot(outer[0] - inner[0], outer[1] - inner[1]) < 0.5) {
      seg.el.setAttribute("visibility", "hidden");
      continue;
    }
    seg.el.removeAttribute("visibility");
    setLine(seg.el, outer, inner);
    setInk(seg.el, inkAt(seg.ink, bearing, eTick));
    seg.el.setAttribute("stroke-width", lerp(seg.width, lineW, eTick).toFixed(3));
  }

  /* Nodes → phase and orbit dots, read LIVE from the About drawing because
     they turn on their own clocks until the morph takes them. */
  const eNode = easedWindow(u, NODES_MORPH);
  for (const node of m.nodes) {
    const mat = node.src.getScreenCTM();
    if (!mat) continue;
    const toStage = (x: number, y: number): [number, number] => {
      const p = new DOMPoint(x, y).matrixTransform(mat);
      return [p.x - m.stageLeft, p.y - m.stageTop];
    };
    let startPts: [number, number][];
    if (node.src instanceof SVGCircleElement) {
      const cx = Number(node.src.getAttribute("cx"));
      const cy = Number(node.src.getAttribute("cy"));
      const r = Number(node.src.getAttribute("r"));
      startPts = [];
      for (let k = 0; k < NODE_SAMPLES; k++) {
        const a = (k / NODE_SAMPLES) * 2 * Math.PI;
        startPts.push(toStage(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
    } else {
      const x = Number(node.src.getAttribute("x"));
      const y = Number(node.src.getAttribute("y"));
      const w = Number(node.src.getAttribute("width"));
      const h = Number(node.src.getAttribute("height"));
      startPts = sampleQuad(
        [...toStage(x, y), ...toStage(x + w, y), ...toStage(x + w, y + h), ...toStage(x, y + h)],
        NODE_SAMPLES / 4
      );
    }
    const c0: [number, number] = [
      startPts.reduce((s, p) => s + p[0], 0) / startPts.length,
      startPts.reduce((s, p) => s + p[1], 0) / startPts.length,
    ];
    const tgt = node.target;
    const c1 = tgt.kind === "phase" ? at(f.phase, tgt.i * 2) : at(f.orbit, tgt.i * 2);
    const r1 = tgt.kind === "phase" ? (f.phaseR[tgt.i] ?? 0) : (f.orbitR[tgt.i] ?? 0);
    const alpha = tgt.kind === "phase" ? (f.phaseAlpha[tgt.i] ?? 0) : (f.orbitAlpha[tgt.i] ?? 0);
    const hex = tgt.kind === "phase" ? COMPASS_GATE_GOLD : COMPASS_ORBIT_INK[tgt.i]!;
    const centre = spiralPoint(S, c0, G, c1, eNode);
    const pts = startPts.map((p) => {
      const a = Math.atan2(p[1] - c0[1], p[0] - c0[0]);
      const endOff: Pt = [r1 * Math.cos(a), r1 * Math.sin(a)];
      return [
        centre[0] + lerp(p[0] - c0[0], endOff[0], eNode),
        centre[1] + lerp(p[1] - c0[1], endOff[1], eNode),
      ] as Pt;
    });
    node.el.setAttribute("d", closedPath(pts));
    setInk(node.el, inkAt(node.ink, gateInk(hex, alpha), eNode), true);
  }

  /* Connectors draw on from their dots. */
  const eConn = easedWindow(u, CONNECTORS_DRAW);
  m.conns.forEach((line, i) => {
    if (eConn <= 0) {
      line.setAttribute("visibility", "hidden");
      return;
    }
    line.removeAttribute("visibility");
    const a = at(f.conn, i * 4);
    const b = at(f.conn, i * 4 + 2);
    setLine(line, a, [lerp(a[0], b[0], eConn), lerp(a[1], b[1], eConn)]);
    setInk(
      line,
      inkAt(
        gateInk(COMPASS_GATE_DAWN, f.connAlpha[i] ?? 0),
        gateInk(COMPASS_GATE_DAWN, f.connAlpha[i] ?? 0),
        0
      )
    );
    line.setAttribute("stroke-width", lineW.toFixed(3));
  });

  /* The lettering inside the orbit scrambles out where it stands. */
  const eText = windowOf(u, SVG_TEXT_OUT);
  m.texts.forEach((t, i) => {
    const next = scrambleLinesOut(m.finals, i, eText);
    if (t.textContent !== next) t.textContent = next;
  });
}

/** Put the lettering back as it was. */
export function restoreGateText(m: GateMeasure | null): void {
  if (!m) return;
  m.texts.forEach((t, i) => {
    const f = m.finals[i] ?? "";
    if (t.textContent !== f) t.textContent = f;
  });
}

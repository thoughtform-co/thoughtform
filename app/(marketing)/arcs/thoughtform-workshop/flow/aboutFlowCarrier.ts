/**
 * aboutFlowCarrier — the About copy leaves on per-line leaves, and the name
 * glides onto the era title (ADR-138; the carrier ADR-137 U2 built, on
 * ADR-103's `headCarrier` idiom).
 *
 * ONE LAYER, TWO KINDS OF LEAF.
 *   · RUNS carry the role, the bio and the orbit's corner readouts OUT from
 *     their own line boxes. While the flow runs the real text is hidden by
 *     `visibility` (the route sheet, keyed on `data-tw-about`) and this layer
 *     paints over it; at the start a leaf is byte-equal to the line it stands
 *     for, on that line's pixels, so the hand-over frame is invisible.
 *   · The GLIDE carries the name from its own seat onto the era title's, and
 *     scrambles "VINCE BUYSSENS" into the first era's name on the way. The two
 *     are one face at one size by construction (`.vwd__mast__title` is
 *     byte-locked to `.voidwalker__name`, ADR-082 U25), so the glide is a pure
 *     translate. The homepage lets the About name travel while the era title
 *     decodes under it; one leaf reads as one name becoming a title.
 *
 * ⚠ THE ERA TITLE IS MEASURED WHERE IT WILL BE, NOT WHERE IT IS. The era
 * stage's own hook publishes its FUTURE pinned rect (`eraTitleRect`, the
 * offset chain plus the sticky top), and the title's live span is blanked the
 * moment that hook engages, so there is nothing to read a line box off. The
 * title's box IS its one line (a grid item under `justify-items: center`, a
 * block holding a ghost of the string), so the leaf's line box is posed on it
 * directly.
 *
 * REGISTER LAW (ArcDecodeText, ADR-103): the name, the role and the readouts
 * SCRAMBLE; prose TYPES.
 *
 * DOM-only, no three, no scroll reads.
 */

import { SCRAMBLE_STAGGER_S, scrambleDuration, scrambleFrame } from "@/lib/home-v2/captionScramble";
import { dress, textRuns } from "@/lib/home-v2/lineLeaves";
import { runSlice, untypeCount } from "@/lib/home-v2/scrubbedDecode";

import { A_OUT, LABELS_OUT, NAME_GLIDE, easedWindow, windowOf, type FlowWindow } from "./flowClock";

interface Leaf {
  el: HTMLElement;
  ink: HTMLElement;
  /** The fragment's text, whitespace collapsed as the browser draws it. */
  text: string;
  /** Where the fragment starts in its run, in reading order. */
  off: number;
  /** The source line's first glyph box, viewport space — the calibration
   *  target. */
  tx: number;
  ty: number;
}

interface Run {
  mode: "scramble" | "type";
  window: FlowWindow;
  /** Total characters in the run. */
  len: number;
  /** The scramble's wall: one timeline for every fragment of the run. */
  wall: number;
  leaves: Leaf[];
}

interface GlideEnd {
  left: number;
  top: number;
  cs: CSSStyleDeclaration;
  lineHeight: number;
}

/** A line that decodes from one text into another while it travels from one
 *  seat to the other. */
interface Glide {
  el: HTMLElement;
  ink: HTMLElement;
  from: string;
  to: string;
  window: FlowWindow;
  a: GlideEnd;
  b: GlideEnd;
  /** Which end's face the leaf wears now, so it is written on a switch. */
  worn: "a" | "b" | null;
  /** The stage's box at measure time: the leaves' coordinate origin. */
  origin: { left: number; top: number };
}

export interface CarrierMeasure {
  runs: Run[];
  glides: Glide[];
}

/**
 * Re-seat the name's glide on the title's LIVE box. The era publishes its
 * title's seat through the offset chain, which rounds to whole pixels
 * (measured: the leaf sat 0.57px left of the title it hands over to); once
 * the era has pinned, its title's own rect is still and exact.
 */
export function reseatNameGlide(m: CarrierMeasure, left: number, top: number): void {
  const g = m.glides[0];
  if (!g) return;
  g.b.left = left - g.origin.left;
  g.b.top = top - g.origin.top;
}

/** Box styles an inline owner paints that a leaf must repeat. */
const BOX_PROPS = [
  "backgroundColor",
  "backgroundImage",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "boxShadow",
  "textDecorationLine",
  "textDecorationColor",
  "textDecorationThickness",
  "textUnderlineOffset",
] as const;

function collapse(s: string): string {
  return s.replace(/\s+/g, " ");
}

/**
 * Measure one run: every text node under `els`, in document order, one leaf
 * per rendered line fragment, posed in the STAGE's coordinates.
 */
function measureRun(
  layer: HTMLElement,
  els: readonly HTMLElement[],
  stageBox: DOMRect,
  mode: Run["mode"],
  window: FlowWindow
): Run {
  const leaves: Leaf[] = [];
  let off = 0;
  for (const root of els) {
    for (const { el: owner, lines } of textRuns(root)) {
      const cs = getComputedStyle(owner);
      const fontSize = parseFloat(cs.fontSize) || 16;
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.2;
      const boxed = owner !== root;
      const padLeft = boxed ? parseFloat(cs.paddingLeft) || 0 : 0;
      for (const line of lines) {
        const text = collapse(line.text);
        if (!text) continue;
        const el = document.createElement("span");
        el.className = "tw-flow-leaf";
        el.hidden = true;
        dress(el, cs);
        el.style.lineHeight = `${lineHeight}px`;
        const ink = document.createElement("span");
        ink.className = "tw-flow-leaf__ink";
        if (boxed) {
          for (const p of BOX_PROPS) ink.style[p] = cs[p];
          ink.style.setProperty("box-decoration-break", "clone");
          ink.style.setProperty("-webkit-box-decoration-break", "clone");
        }
        el.appendChild(ink);
        el.style.left = `${(line.left - stageBox.left - padLeft).toFixed(2)}px`;
        el.style.top = `${(line.top - stageBox.top - (lineHeight - line.height) / 2).toFixed(2)}px`;
        layer.appendChild(el);
        leaves.push({ el, ink, text, off, tx: line.left, ty: line.top });
        off += text.length;
      }
    }
  }
  const whole = leaves.map((l) => l.text).join("");
  return { mode, window, len: off, wall: scrambleDuration("", whole), leaves };
}

/** The About's own copy. */
export interface AboutRuns {
  name: HTMLElement;
  role: HTMLElement;
  bios: readonly HTMLElement[];
  /** The orbit's four corner readouts. */
  labels: readonly HTMLElement[];
}

/** Where the era title will sit once its stage pins, and what it will say. */
export interface EraTitleSeat {
  /** Viewport px of the title's box at the era's pin. */
  left: number;
  top: number;
  /** The title's computed face (one line, the name's face by construction). */
  cs: CSSStyleDeclaration;
  /** The first era's name, as the title will letter it. */
  text: string;
}

/**
 * Everything that changes only when the page re-lays-out. Without a seat (the
 * era stage has not measured yet) the name scrambles out with the rest.
 * ⚠ REBUILDS THE LAYER'S CHILDREN.
 */
export function measureCarrier(
  layer: HTMLElement,
  stage: HTMLElement,
  a: AboutRuns,
  seat: EraTitleSeat | null
): CarrierMeasure {
  const stageBox = stage.getBoundingClientRect();
  layer.replaceChildren();
  const runs: Run[] = [
    measureRun(layer, [a.role], stageBox, "scramble", A_OUT),
    measureRun(layer, a.bios, stageBox, "type", A_OUT),
    measureRun(layer, a.labels, stageBox, "scramble", LABELS_OUT),
  ];
  if (!seat) runs.unshift(measureRun(layer, [a.name], stageBox, "scramble", A_OUT));
  calibrate(layer, runs);
  const glide = seat ? measureNameGlide(layer, a.name, seat, stageBox) : null;
  return { runs, glides: glide ? [glide] : [] };
}

function endOf(cs: CSSStyleDeclaration): GlideEnd {
  const fontSize = parseFloat(cs.fontSize) || 10;
  return { left: 0, top: 0, cs, lineHeight: parseFloat(cs.lineHeight) || fontSize * 1.2 };
}

/** Dress a glide leaf in one end's face, at that end's line box. */
function wear(g: Glide, end: GlideEnd): void {
  dress(g.el, end.cs);
  g.el.style.lineHeight = `${end.lineHeight}px`;
}

/** Where a leaf's first glyph lands, viewport space, with `text` in it. */
function glyphOrigin(ink: HTMLElement, text: string): { x: number; y: number } | null {
  ink.textContent = text;
  const node = ink.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, Math.max(1, text.search(/\s|$/)));
  const r = range.getBoundingClientRect();
  range.detach();
  return r.width || r.height ? { x: r.left, y: r.top } : null;
}

/**
 * The name's glide. Its FROM end is calibrated by measurement on the name's
 * own first line (a text `Range`'s height is rounded, so the half-leading
 * arithmetic alone is up to a pixel out). Its TO end is the title's box,
 * which is its line box: the same face at the same line height lands the
 * glyphs where the title's will be.
 */
function measureNameGlide(
  layer: HTMLElement,
  name: HTMLElement,
  seat: EraTitleSeat,
  stageBox: DOMRect
): Glide | null {
  const runs = textRuns(name);
  const line = runs[0]?.lines[0];
  if (!runs[0] || !line) return null;
  const el = document.createElement("span");
  el.className = "tw-flow-leaf";
  const ink = document.createElement("span");
  ink.className = "tw-flow-leaf__ink";
  el.appendChild(ink);
  const wasHidden = layer.hidden;
  layer.style.visibility = "hidden";
  layer.hidden = false;
  layer.appendChild(el);
  const g: Glide = {
    el,
    ink,
    from: collapse(line.text),
    to: collapse(seat.text),
    window: NAME_GLIDE,
    a: endOf(getComputedStyle(runs[0].el)),
    b: endOf(seat.cs),
    worn: null,
    origin: { left: stageBox.left, top: stageBox.top },
  };
  wear(g, g.a);
  g.a.left = line.left - stageBox.left;
  g.a.top = line.top - stageBox.top - (g.a.lineHeight - line.height) / 2;
  el.style.left = `${g.a.left}px`;
  el.style.top = `${g.a.top}px`;
  const o = glyphOrigin(ink, g.from);
  if (o) {
    g.a.left += line.left - o.x;
    g.a.top += line.top - o.y;
  }
  g.b.left = seat.left - stageBox.left;
  g.b.top = seat.top - stageBox.top;
  ink.textContent = "";
  el.hidden = true;
  layer.hidden = wasHidden;
  layer.style.removeProperty("visibility");
  return g;
}

function writeGlide(g: Glide, u: number): void {
  const e = easedWindow(u, g.window);
  const want = e < 0.5 ? "a" : "b";
  if (g.worn !== want) {
    wear(g, want === "a" ? g.a : g.b);
    g.worn = want;
  }
  g.el.style.left = `${(g.a.left + (g.b.left - g.a.left) * e).toFixed(2)}px`;
  g.el.style.top = `${(g.a.top + (g.b.top - g.a.top) * e).toFixed(2)}px`;
  let text: string;
  if (!(e > 0)) text = g.from;
  else if (e >= 1) text = g.to;
  else text = scrambleFrame({ from: g.from, to: g.to }, e * scrambleDuration(g.from, g.to)) ?? g.to;
  if (g.ink.textContent !== text) g.ink.textContent = text;
  if (g.el.hidden) g.el.hidden = false;
}

/**
 * Put every run leaf's first glyph ON its source's first glyph, measured: a
 * text `Range`'s height is rounded to whole pixels, so the half-leading
 * arithmetic lands a leaf up to a pixel off its line. One batched write, one
 * read, one write, invisible (the layer is `visibility: hidden` for the pass).
 */
function calibrate(layer: HTMLElement, runs: readonly Run[]): void {
  const leaves = runs.flatMap((r) => r.leaves);
  if (!leaves.length) return;
  const wasHidden = layer.hidden;
  layer.style.visibility = "hidden";
  layer.hidden = false;
  for (const leaf of leaves) {
    leaf.el.hidden = false;
    leaf.ink.textContent = leaf.text;
  }
  const deltas = leaves.map((leaf) => {
    const node = leaf.ink.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return [0, 0] as const;
    const end = leaf.text.search(/\s|$/);
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, Math.max(1, end));
    const r = range.getBoundingClientRect();
    range.detach();
    if (!r.width && !r.height) return [0, 0] as const;
    return [leaf.tx - r.left, leaf.ty - r.top] as const;
  });
  leaves.forEach((leaf, i) => {
    const [dx, dy] = deltas[i]!;
    leaf.el.style.left = `${(parseFloat(leaf.el.style.left) + dx).toFixed(2)}px`;
    leaf.el.style.top = `${(parseFloat(leaf.el.style.top) + dy).toFixed(2)}px`;
    leaf.el.hidden = true;
    leaf.ink.textContent = "";
  });
  layer.hidden = wasHidden;
  layer.style.removeProperty("visibility");
}

/** A fragment scrambling at `v` (0 = blank, 1 = whole), on its run's shared
 *  wall so the fragments decode as one line. */
function scrambleAt(leaf: Leaf, run: Run, v: number): string {
  if (!(v > 0)) return "";
  if (v >= 1) return leaf.text;
  const t = v * run.wall - leaf.off * SCRAMBLE_STAGGER_S;
  if (t <= 0) return "";
  return scrambleFrame({ from: "", to: leaf.text }, t) ?? leaf.text;
}

/** One frame at the About's run `u`. Every run here goes OUT: a scramble is
 *  the in-decode played backwards, a type run empties from its end. A leaf
 *  with nothing to show is hidden, so an empty ink never paints a wash. */
export function writeCarrier(layer: HTMLElement, m: CarrierMeasure, u: number): void {
  let any = false;
  for (const run of m.runs) {
    const e = windowOf(u, run.window);
    for (const leaf of run.leaves) {
      const next =
        run.mode === "type"
          ? runSlice(leaf.text, leaf.off, untypeCount(run.len, e))
          : scrambleAt(leaf, run, 1 - e);
      const show = next.length > 0;
      if (leaf.el.hidden === show) leaf.el.hidden = !show;
      if (show) {
        any = true;
        if (leaf.ink.textContent !== next) leaf.ink.textContent = next;
      }
    }
  }
  for (const g of m.glides) {
    writeGlide(g, u);
    any = true;
  }
  if (layer.hidden === any) layer.hidden = !any;
}

/** Put the layer away. */
export function parkCarrier(layer: HTMLElement | null): void {
  if (!layer) return;
  layer.hidden = true;
}

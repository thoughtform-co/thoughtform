/**
 * aboutTurnCarrier — the About copy leaves and the thesis copy arrives, on
 * per-line leaves (ADR-137 U2, on ADR-103's `headCarrier` idiom).
 *
 * TWO SETS OF RUNS, ONE LAYER. The About's name, role and bio (set A) are
 * carried OUT from their own line boxes; the Arc's thesis title and its two
 * paragraphs (set B) are carried IN on the LIVE corridor copy's line boxes.
 * Nothing in either source is edited: while the turn runs, the real text is
 * hidden by `visibility` (the route sheet, keyed on `data-tw-turn`) and this
 * layer paints over it. At both ends a leaf is byte-equal to the line it
 * stands for, on that line's pixels, so the hand-over frames are invisible
 * — which is the whole answer to ADR-022's rejected proxy.
 *
 * ⚠ SET B IS THE CORRIDOR'S OWN DOM, READ, NEVER WRITTEN. Its strings come
 * from the main prototype through `extractV7Text`, so reading them off the
 * live elements is the only way the leaves can be the same strings.
 *
 * ⚠ A LEAF IS A BLOCK AND AN INK SPAN. The block carries the run's face and
 * its line box; the inline ink inside it carries the owner's BOX styles —
 * the bio's gold highlight block, the entity underline, the thesis title's
 * gold-wash marker — because an inline background paints the content area
 * plus padding, and a block's would paint the whole line box. `dress` copies
 * the face only, so the box half is copied here.
 *
 * REGISTER LAW (ArcDecodeText, ADR-103): the name, the role and the display
 * title SCRAMBLE; prose TYPES. The shuffle's glyph pool is mono caps and
 * reads as noise through lowercase prose.
 *
 * DOM-only, no three, no scroll reads.
 */

import { SCRAMBLE_STAGGER_S, scrambleDuration, scrambleFrame } from "@/lib/home-v2/captionScramble";
import { dress, textRuns } from "@/lib/home-v2/lineLeaves";
import { runSlice, typeCount, untypeCount } from "@/lib/home-v2/scrubbedDecode";

import {
  A_BOX_OUT,
  A_OUT,
  B_BODY_IN,
  B_TITLE_IN,
  LABELS_GLIDE,
  easedWindow,
  windowOf,
  type TurnWindow,
} from "./aboutTurnClock";

interface Leaf {
  el: HTMLElement;
  ink: HTMLElement;
  /** The fragment's final text, whitespace collapsed as the browser draws it. */
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
  dir: "in" | "out";
  window: TurnWindow;
  /** Total characters in the run. */
  len: number;
  /** The scramble's wall: one timeline for every fragment of the run, so a
   *  title split across text nodes and lines decodes as ONE line of type. */
  wall: number;
  leaves: Leaf[];
}

/** A line that decodes from one text into another WHILE it travels and
 *  resizes from one seat to the other: a corner readout of the About orbit
 *  becoming its phase label on the gate (ADR-137 U3). */
interface Glide {
  el: HTMLElement;
  ink: HTMLElement;
  from: string;
  to: string;
  /** Calibrated leaf poses (stage px) and faces at both ends. */
  a: GlideEnd;
  b: GlideEnd;
  /** Which end's face the leaf wears now, so it is written on a switch. */
  worn: "a" | "b" | null;
}

interface GlideEnd {
  left: number;
  top: number;
  cs: CSSStyleDeclaration;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
}

export interface CarrierMeasure {
  runs: Run[];
  glides: Glide[];
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
 * Measure one run: every text node under `els`, in document order (which is
 * reading order for this left-to-right inline copy), one leaf per rendered
 * line fragment, posed in the STAGE's coordinates.
 */
function measureRun(
  layer: HTMLElement,
  els: readonly HTMLElement[],
  stageBox: DOMRect,
  mode: Run["mode"],
  dir: Run["dir"],
  window: TurnWindow
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
        el.className = "tw-turn-leaf";
        el.hidden = true;
        dress(el, cs);
        /* The leaf's line box is pinned to the px value the half-leading
           correction below uses, so a `normal` line-height cannot resolve to
           a different box than the one the arithmetic assumed. */
        el.style.lineHeight = `${lineHeight}px`;
        const ink = document.createElement("span");
        ink.className = "tw-turn-leaf__ink";
        if (boxed) {
          for (const p of BOX_PROPS) ink.style[p] = cs[p];
          ink.style.setProperty("box-decoration-break", "clone");
          ink.style.setProperty("-webkit-box-decoration-break", "clone");
        }
        el.appendChild(ink);
        /* A `Range` rect is the glyph content area; the leaf's glyphs sit on
           it once the half-leading is taken off its top, and once a boxed
           owner's left padding is taken off its left. */
        el.style.left = `${(line.left - stageBox.left - padLeft).toFixed(2)}px`;
        el.style.top = `${(line.top - stageBox.top - (lineHeight - line.height) / 2).toFixed(2)}px`;
        layer.appendChild(el);
        leaves.push({ el, ink, text, off, tx: line.left, ty: line.top });
        off += text.length;
      }
    }
  }
  const whole = leaves.map((l) => l.text).join("");
  return { mode, dir, window, len: off, wall: scrambleDuration("", whole), leaves };
}

/** Set A: the About's own copy, carried out. `labels` are the orbit's
 *  corner readouts; three of them glide onto the gate's phase labels and
 *  the fourth (`out`) scrambles away. */
export interface AboutRuns {
  name: HTMLElement;
  role: HTMLElement;
  bios: readonly HTMLElement[];
  labels: { glide: readonly HTMLElement[]; out: HTMLElement | null };
}

/** Set B: the live corridor copy, carried in. `phases` pair with
 *  `AboutRuns.labels.glide`, index for index. */
export interface ThesisRuns {
  title: HTMLElement;
  bodies: readonly HTMLElement[];
  phases: readonly HTMLElement[];
}

/**
 * Everything that changes only when the page re-lays-out. `b` is optional:
 * the corridor copy exists only once the corridor has mounted and armed, so
 * the About's half can be carried before the Arc's half is measurable.
 * ⚠ REBUILDS THE LAYER'S CHILDREN.
 */
export function measureCarrier(
  layer: HTMLElement,
  stage: HTMLElement,
  a: AboutRuns,
  b: ThesisRuns | null
): CarrierMeasure {
  const stageBox = stage.getBoundingClientRect();
  layer.replaceChildren();
  const runs: Run[] = [
    measureRun(layer, [a.name], stageBox, "scramble", "out", A_OUT),
    measureRun(layer, [a.role], stageBox, "scramble", "out", A_OUT),
    measureRun(layer, a.bios, stageBox, "type", "out", A_OUT),
  ];
  if (a.labels.out) {
    runs.push(measureRun(layer, [a.labels.out], stageBox, "scramble", "out", A_BOX_OUT));
  }
  if (b) {
    runs.push(measureRun(layer, [b.title], stageBox, "scramble", "in", B_TITLE_IN));
    runs.push(measureRun(layer, b.bodies, stageBox, "type", "in", B_BODY_IN));
  }
  calibrate(layer, runs);
  const glides = b ? measureGlides(layer, a.labels.glide, b.phases, stageBox) : [];
  return { runs, glides };
}

function endOf(cs: CSSStyleDeclaration): GlideEnd {
  const fontSize = parseFloat(cs.fontSize) || 10;
  return {
    left: 0,
    top: 0,
    cs,
    fontSize,
    letterSpacing: parseFloat(cs.letterSpacing) || 0,
    lineHeight: parseFloat(cs.lineHeight) || fontSize * 1.2,
  };
}

/** Dress a glide leaf in one end's face, at that end's metrics. */
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
 * Pair each source line with its destination line (the first text line of
 * each, in order) and calibrate the leaf's pose at BOTH ends by measurement,
 * for the reason `calibrate` exists: a text `Range`'s height is rounded, so
 * an arithmetic seat is up to a pixel out.
 */
function measureGlides(
  layer: HTMLElement,
  from: readonly HTMLElement[],
  to: readonly HTMLElement[],
  stageBox: DOMRect
): Glide[] {
  const glides: Glide[] = [];
  const wasHidden = layer.hidden;
  layer.style.visibility = "hidden";
  layer.hidden = false;
  for (let p = 0; p < Math.min(from.length, to.length); p++) {
    const aRuns = textRuns(from[p]!);
    const bRuns = textRuns(to[p]!);
    for (let i = 0; i < Math.min(aRuns.length, bRuns.length); i++) {
      const aLine = aRuns[i]!.lines[0];
      const bLine = bRuns[i]!.lines[0];
      if (!aLine || !bLine) continue;
      const el = document.createElement("span");
      el.className = "tw-turn-leaf";
      const ink = document.createElement("span");
      ink.className = "tw-turn-leaf__ink";
      el.appendChild(ink);
      layer.appendChild(el);
      const g: Glide = {
        el,
        ink,
        from: collapse(aLine.text),
        to: collapse(bLine.text),
        a: endOf(getComputedStyle(aRuns[i]!.el)),
        b: endOf(getComputedStyle(bRuns[i]!.el)),
        worn: null,
      };
      const ends = [
        { end: g.a, line: aLine, text: g.from },
        { end: g.b, line: bLine, text: g.to },
      ];
      for (const { end, line, text } of ends) {
        wear(g, end);
        end.left = line.left - stageBox.left;
        end.top = line.top - stageBox.top - (end.lineHeight - line.height) / 2;
        el.style.left = `${end.left}px`;
        el.style.top = `${end.top}px`;
        const o = glyphOrigin(ink, text);
        if (o) {
          end.left += line.left - o.x;
          end.top += line.top - o.y;
        }
      }
      ink.textContent = "";
      el.hidden = true;
      glides.push(g);
    }
  }
  layer.hidden = wasHidden;
  layer.style.removeProperty("visibility");
  return glides;
}

function writeGlide(g: Glide, u: number): void {
  const e = easedWindow(u, LABELS_GLIDE);
  const want = e < 0.5 ? "a" : "b";
  if (g.worn !== want) {
    wear(g, want === "a" ? g.a : g.b);
    g.worn = want;
  }
  g.el.style.fontSize = `${g.a.fontSize + (g.b.fontSize - g.a.fontSize) * e}px`;
  g.el.style.letterSpacing = `${g.a.letterSpacing + (g.b.letterSpacing - g.a.letterSpacing) * e}px`;
  g.el.style.lineHeight = `${g.a.lineHeight + (g.b.lineHeight - g.a.lineHeight) * e}px`;
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
 * Put every leaf's first glyph ON its source's first glyph, measured.
 *
 * ⚠ THE HALF-LEADING ARITHMETIC IS ONLY A FIRST GUESS. A text `Range`'s
 * height comes back ROUNDED to whole pixels (33 against a 32.79px line box
 * on the thesis title), so `(lineHeight − rect.height) / 2` lands the leaf up
 * to a pixel off its line, and the hand-over is the frame that shows it. So
 * each leaf is laid out once with its final text, its own first word's
 * `Range` read the same way the source's was, and the difference taken off.
 * One batched write, one read, one write: invisible (the layer is
 * `visibility: hidden` for the pass) and it leaves every leaf as it found it.
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

/** A fragment scrambling IN at `v` (0 = blank, 1 = whole), on its run's
 *  shared wall so the fragments decode as one line. Ends compared, never
 *  asked of the kernel (a floating-point bet). */
function scrambleIn(leaf: Leaf, run: Run, v: number): string {
  if (!(v > 0)) return "";
  if (v >= 1) return leaf.text;
  const t = v * run.wall - leaf.off * SCRAMBLE_STAGGER_S;
  if (t <= 0) return "";
  return scrambleFrame({ from: "", to: leaf.text }, t) ?? leaf.text;
}

/** One frame at turn clock `u`. A leaf with nothing to show is hidden, so
 *  an empty ink with padding never paints a stray wash. */
export function writeCarrier(layer: HTMLElement, m: CarrierMeasure, u: number): void {
  let any = false;
  for (const run of m.runs) {
    const e = windowOf(u, run.window);
    for (const leaf of run.leaves) {
      let next: string;
      if (run.mode === "type") {
        const count = run.dir === "out" ? untypeCount(run.len, e) : typeCount(run.len, e);
        next = runSlice(leaf.text, leaf.off, count);
      } else {
        /* Out is the in-decode run backwards: every character keeps its
           cell and the line empties from its right, the last line first. */
        next = scrambleIn(leaf, run, run.dir === "out" ? 1 - e : e);
      }
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

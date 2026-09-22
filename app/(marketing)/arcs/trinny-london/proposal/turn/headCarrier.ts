/**
 * headCarrier — the section head stays and DECODES in place (ADR-103).
 *
 * Owner, 2026-09-15: the eyebrow "disappears" between the board and the
 * phases while the title and the paragraph "always appear at the same
 * location", so "it makes more sense to just morph it via a glitch effect
 * than to have them disappear … and then reappear again in the next
 * section". On this site that morph is the house decode kernel, never a
 * luminance glitch (ADR-097 U12).
 *
 * THE MECHANISM IS THE SEAM CARRIER'S, WITH ZERO TRAVEL. The three scene
 * heads are pixel-identical on the datum (ADR-100 U4 measured it), so the
 * layer's leaves are born on beat k's own line boxes, decode there, and hand
 * over to beat k + 1's real text on the frame the strings are byte-equal —
 * the same welds the band carriers make, on the same pixels. Nothing in the
 * real heads is edited: their text is HIDDEN by `visibility` on the columns'
 * children while a window runs (the route sheet, keyed on the writer's
 * `data-tl-head-*` stamps), and the layer paints over it.
 *
 * ⚠ WHY NOT DECODE THE REAL TEXT IN PLACE. The title's `pre` is a bare Text
 * node (nothing to style or measure but the run itself), and a shuffling run
 * wider than its line re-wraps: the coord stamps move, the close cross moves,
 * and — during 1.34–1.50 — the board's svg under carrier 0, whose start box is
 * solved off that svg's rect every frame. A layer of `nowrap` LINE leaves
 * touches nothing in layout.
 *
 * ⚠ THE LEAVES ARE RENDERED LINE BOXES, NOT RUNS. A run is walked word by
 * word with a `Range`, its rects grouped by line, and one leaf posed per
 * line — so a two-line title decodes as two lines that stay two lines, and a
 * three-line paragraph as three. A `Range` rect is the glyph CONTENT area,
 * not the line box: the leaf is a block with the run's own `line-height`, so
 * the half-leading is subtracted to put its glyphs on the source's pixels.
 * The smoke measures that weld to half a pixel.
 *
 * ⚠ EVERY TYPOGRAPHIC VALUE IS COPIED FROM THE RUN'S COMPUTED STYLE, INLINE.
 * The layer sits beside `.arc-root`, where none of `--arc-*` resolves, and
 * the route sheet is pinned at zero type literals — so the face, size,
 * weight, tracking, transform, colour and shadow are read off the element
 * that owns them and written onto the leaf, once per measure. The `em` line
 * keeps its gold on its own leaf; nothing is lerped, because both heads use
 * the same tokens.
 *
 * ⚠ REGISTER LAW: mono chrome and the display title SCRAMBLE; the paragraph
 * TYPES (`typeFrame`) — the caps glyph pool reads as noise through lowercase
 * prose (`ArcDecodeText`'s own ruling).
 *
 * Same source pins as `seamCarrier.ts`: appended INTO the stage, never on
 * `document.body`; no document-space scroll offset, no `getPropertyValue`,
 * no `innerWidth`, no `transform` attribute (`trinny-seam` reads this file).
 */

import { decodeClock, headIntro, headLead, type HeadCol } from "./turnClock";
import { seamDecodeFrame, seamWall, typeCounts, typedSlice, type SeamPair } from "./seamDecode";
/* The line walker and the leaf's dressing are the house's since ADR-115
   (`lib/home-v2/lineLeaves.ts`) — the phone's two bands decode centred runs
   on the same per-line leaves. Byte-identical to the functions this file
   carried; only their home moved. */
import { dress, firstText, lineBoxes } from "@/lib/home-v2/lineLeaves";

/** The three scene beats, in reading order. */
const BEATS = ["#configuration", "#phases", "#outcomes"] as const;

interface HeadLeaf {
  el: HTMLElement;
  pair: SeamPair;
  /** Mono chrome and the title scramble; the paragraph types. */
  mode: "scramble" | "type";
  /** A typed line's place in its run, both sides: where it starts and how
   *  long the whole run is — so the run types as ONE typewriter across its
   *  lines, not as one per line. */
  offFrom: number;
  runFrom: number;
  offTo: number;
  runTo: number;
}

interface HeadCarrier {
  col: HeadCol;
  /** Window index: beat `k` → beat `k + 1`. */
  k: number;
  leaves: HeadLeaf[];
  /** One wall for every scrambled line, so they land on one frame. */
  wall: number;
}

export interface HeadMeasure {
  carriers: HeadCarrier[];
}

/* ── Mount ───────────────────────────────────────────────────────────── */

/** Append the layer INTO the stage (idempotent under Strict Mode's double
 *  effect). Absolute over the stage's own box, so its poses are the stage's. */
export function mountHeadLayer(stage: HTMLElement): HTMLElement {
  const existing = stage.querySelector<HTMLElement>(":scope > .tl-head");
  if (existing) return existing;
  const layer = document.createElement("div");
  layer.className = "tl-head";
  layer.setAttribute("aria-hidden", "true");
  layer.hidden = true;
  stage.appendChild(layer);
  return layer;
}

/* ── Measure ─────────────────────────────────────────────────────────── */

interface Run {
  /** The text node the words live in. */
  node: Text;
  /** The element whose computed style the leaf copies. */
  el: HTMLElement;
  mode: "scramble" | "type";
}

/** A column's runs, in reading order. A run the head does not carry (no
 *  `em`, say) is simply absent on both sides. */
function runsOf(head: HTMLElement, col: HeadCol): Run[] {
  const runs: Run[] = [];
  const push = (el: HTMLElement | null, mode: Run["mode"], node = firstText(el)) => {
    if (el && node) runs.push({ node, el, mode });
  };
  if (col === "lead") {
    const lead = head.querySelector<HTMLElement>(":scope > .arc-head__lead");
    push(lead?.querySelector<HTMLElement>(":scope > .arc-head__desig") ?? null, "scramble");
    const title = lead?.querySelector<HTMLElement>(":scope > .arc-head__title") ?? null;
    push(title, "scramble");
    push(title?.querySelector<HTMLElement>("em") ?? null, "scramble");
    push(lead?.querySelector<HTMLElement>(":scope > .arc-head__coord") ?? null, "scramble");
  } else {
    const intro = head.querySelector<HTMLElement>(":scope > .arc-head__intro");
    push(intro?.querySelector<HTMLElement>(":scope > .arc-head__desig") ?? null, "scramble");
    push(intro?.querySelector<HTMLElement>(":scope > .arc-head__copy") ?? null, "type");
    push(intro?.querySelector<HTMLElement>(":scope > .arc-head__coord") ?? null, "scramble");
  }
  return runs;
}

/**
 * Everything that changes only when the page re-lays-out. Returns null
 * until all three heads exist inside the stage — the beats are a lazy
 * nested root, and a layer with nothing to carry has to be a NO-OP.
 *
 * ⚠ REBUILDS THE LAYER'S CHILDREN. These are childList mutations inside the
 * stage the writer's observer watches; the writer filters this layer out and
 * drains the records after every measure.
 */
export function measureHeads(
  layer: HTMLElement,
  root: HTMLElement,
  stage: HTMLElement
): HeadMeasure | null {
  const heads = BEATS.map((id) => root.querySelector<HTMLElement>(`#proposition ${id} .arc-head`));
  if (heads.some((h) => !h)) return null;
  const stageBox = stage.getBoundingClientRect();
  layer.replaceChildren();

  const carriers: HeadCarrier[] = [];
  for (const col of ["lead", "intro"] as const) {
    for (let k = 0; k < heads.length - 1; k++) {
      const src = runsOf(heads[k]!, col);
      const dst = runsOf(heads[k + 1]!, col);
      const n = Math.max(src.length, dst.length);
      const leaves: HeadLeaf[] = [];
      for (let r = 0; r < n; r++) {
        const a = src[r];
        const b = dst[r];
        const aLines = a ? lineBoxes(a.node) : [];
        const bLines = b ? lineBoxes(b.node) : [];
        const ref = a ?? b;
        if (!ref) continue;
        const cs = getComputedStyle(ref.el);
        const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const count = Math.max(aLines.length, bLines.length);
        const runFrom = aLines.reduce((n, l) => n + l.text.length, 0);
        const runTo = bLines.reduce((n, l) => n + l.text.length, 0);
        let offFrom = 0;
        let offTo = 0;
        for (let i = 0; i < count; i++) {
          const line = aLines[i] ?? bLines[i];
          const el = document.createElement("span");
          el.className = "tl-head__line";
          el.hidden = true;
          dress(el, cs);
          /* A `Range` rect is the content area; the leaf is a block with the
             run's own line-height, so its glyphs sit on the source's pixels
             only once the half-leading is taken off its top. */
          el.style.setProperty("--x", `${(line.left - stageBox.left).toFixed(2)}px`);
          el.style.setProperty(
            "--y",
            `${(line.top - stageBox.top - (lineHeight - line.height) / 2).toFixed(2)}px`
          );
          layer.appendChild(el);
          const from = aLines[i]?.text ?? "";
          const to = bLines[i]?.text ?? "";
          leaves.push({ el, pair: { from, to }, mode: ref.mode, offFrom, runFrom, offTo, runTo });
          offFrom += from.length;
          offTo += to.length;
        }
      }
      carriers.push({
        col,
        k,
        leaves,
        wall: seamWall(leaves.filter((l) => l.mode === "scramble").map((l) => l.pair)),
      });
    }
  }
  return { carriers };
}

/* ── Write ───────────────────────────────────────────────────────────── */

/** One frame, at scene clock `sv`: every carrier whose window is open paints
 *  its lines mid-decode; every other is hidden.
 *  ⚠ THE DECODE RIDES `decodeClock`, THE SEAM'S OWN HOLD (ADR-102's trap: a
 *  decode from zero shuffles the band it stands on). The window `e` is when
 *  the layer PAINTS — the real text is hidden for all of it — but the text
 *  it paints is beat k's, byte-equal, through the first fifth, and beat
 *  k + 1's, byte-equal, through the last tenth, so both hand-over frames are
 *  pixel-identical to the line they replace. Without it the wall had already
 *  touched the first glyphs at `e` 0.03 (`HEIIny London`), and the frame the
 *  real text went out on carried four wrong letters. */
export function writeHeads(layer: HTMLElement, m: HeadMeasure, sv: number): void {
  let any = false;
  for (const c of m.carriers) {
    const e = c.col === "lead" ? headLead(c.k, sv) : headIntro(c.k, sv);
    const live = e > 0 && e < 1;
    const u = decodeClock(e);
    for (const leaf of c.leaves) {
      if (!live) {
        if (!leaf.el.hidden) leaf.el.hidden = true;
        continue;
      }
      any = true;
      if (leaf.el.hidden) leaf.el.hidden = false;
      let next: string;
      if (leaf.mode === "type") {
        /* One typewriter over the whole run: the outgoing paragraph un-types
           from its last line up, the incoming types from its first line down. */
        const t = typeCounts(leaf.runFrom, leaf.runTo, u);
        next =
          t.keep > 0
            ? typedSlice(leaf.pair.from, leaf.offFrom, t.keep)
            : typedSlice(leaf.pair.to, leaf.offTo, t.typed);
      } else {
        next = seamDecodeFrame(leaf.pair, u, c.wall);
      }
      if (leaf.el.textContent !== next) leaf.el.textContent = next;
    }
  }
  if (layer.hidden === any) layer.hidden = !any;
}

/** Put the layer away. */
export function parkHeads(layer: HTMLElement | null): void {
  if (!layer) return;
  layer.hidden = true;
  for (const el of layer.querySelectorAll<HTMLElement>(".tl-head__line")) el.hidden = true;
}

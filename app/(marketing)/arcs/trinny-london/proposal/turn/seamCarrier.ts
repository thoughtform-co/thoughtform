/**
 * seamCarrier — the chip becomes the three plate head bands (ADR-101 §B,
 * re-cut as ONE PINNED SCENE by ADR-102).
 *
 * Owner, 2026-09-14, on the first cut: it "jitters and lags", and _"the top
 * part, AI capability, should first move to the utter left and then the other
 * card should open up to the right of it"_.
 *
 * So there is still no dissolve anywhere in here, and the object is still ONE
 * object: it lifts off the board as the chip, slides to the far left and lands
 * as plate 1's head band — changing its box, its corner cut, its edge colour
 * and its two words on the way — then a copy peels off that band and travels
 * to plate 2's, and a copy of THAT to plate 3's, each plate unrolling out of
 * the band that arrived. What is HIDDEN rather than faded is the chip's group
 * once the carrier has taken it, and each real band until its carrier lands.
 *
 * ⚠ THE LAYER LIVES INSIDE THE STAGE NOW, ABSOLUTE, AND THAT IS THE WHOLE
 * CURE FOR THE JITTER. ADR-101 put it on `document.body` in document space,
 * because the chip and the heads were both glued to a page the reader was
 * scrolling — and a main-thread writer posing a box against a page the
 * COMPOSITOR is moving lands one frame behind it on every wheel step (the hero
 * curtain's own measurement on this route). Inside a sticky stage that is
 * PINNED for the whole choreography, the chip, the three heads and the
 * carrier are all stationary in the frame while the clock runs: there is
 * nothing for the writer to be behind. Poses are written in the STAGE's own
 * coordinates, read off its live rect every frame — ⚠ never assumed to be
 * (0, 0): `.station` is `100vw` with `margin-left: calc(50% − 50vw)`, so on a
 * window with a scrollbar the stage's left edge is a few px outboard of the
 * frame's.
 *
 * ⚠ EVERY COLOUR AND EVERY LENGTH IS RESOLVED THROUGH A PROBE, never read with
 * `getPropertyValue`. A custom property is a STRING until something lays it out
 * (`--arc-plate-ch` is a `clamp()`; `--arc-edge` is `rgba(var(--dawn-rgb), …)`),
 * and this layer sits beside `.arc-root`, not inside it, so none of those
 * tokens resolve here. The probe goes inside the element that OWNS the token
 * and reports the pixel.
 */

import {
  carrierWindow,
  decodeClock,
  fitCropMid,
  lerpRect,
  SEAM_CHIP_CUT,
  type SeamRect,
} from "./turnClock";
import { seamDecodeFrame, seamWall, type SeamPair } from "./seamDecode";

const CARRIERS = 3;

interface Pose {
  /** px in the carrier's own box */
  x: number;
  y: number;
  fs: number;
  /** letter-spacing, px */
  ls: number;
}

interface Leaf {
  el: HTMLElement;
  /** Pose at the start of this carrier's travel and at its end. */
  a: Pose;
  b: Pose;
  pair: SeamPair;
  /** The ink at each end, as RGBA quadruples. */
  inkA: number[];
  inkB: number[];
}

interface Carrier {
  el: HTMLElement;
  leaves: Leaf[];
  /** Where it starts, px in the STAGE's box — `null` for the chip, which is
   *  solved live off the svg's rect every frame. */
  from: SeamRect | null;
  /** Where it lands, px in the stage's box: its own plate's head band. */
  to: SeamRect;
  /** The corner cut at each end, px; `null` at the chip end (solved live). */
  chA: number | null;
  chB: number;
  /** The edge colour at each end, as RGBA quadruples. */
  edgeA: number[];
  edgeB: number[];
  /** One decode wall for both of its lines. */
  wall: number;
}

export interface SeamMeasure {
  svg: SVGSVGElement;
  vb: { w: number; h: number };
  /** The chip's box in the board's own user units. */
  chip: SeamRect;
  carriers: Carrier[];
}

/* ── Probes ──────────────────────────────────────────────────────────── */

function probe<T>(host: HTMLElement, css: string, read: (el: HTMLElement) => T): T {
  const el = document.createElement("i");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `position:absolute;left:-9999px;top:0;${css}`;
  host.appendChild(el);
  const v = read(el);
  el.remove();
  return v;
}

const resolveColor = (host: HTMLElement, token: string, fallback: string): string =>
  probe(host, `color:var(${token},${fallback})`, (el) => getComputedStyle(el).color);

const resolveLen = (host: HTMLElement, token: string): number =>
  probe(host, `height:1px;width:var(${token},0px)`, (el) => el.getBoundingClientRect().width);

/** `rgb()` / `rgba()` → four numbers. Anything unparseable reads as opaque ink. */
function rgba(v: string): number[] {
  const n = (v.match(/[\d.]+/g) ?? []).map(Number);
  return n.length >= 3 ? [n[0], n[1], n[2], n[3] ?? 1] : [0, 0, 0, 1];
}

const mixRgba = (a: number[], b: number[], u: number) =>
  `rgba(${[0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * u)).join(",")},${(
    a[3] +
    (b[3] - a[3]) * u
  ).toFixed(3)})`;

const trackPx = (v: string): number => (v === "normal" ? 0 : parseFloat(v) || 0);

/**
 * Where a span's own text BASELINE sits inside its box, in px.
 *
 * ⚠ MEASURED, NOT DERIVED FROM A FONT TABLE. The chip's words are SVG `<text>`
 * placed on their baseline and the carrier's are HTML spans placed by their box
 * top, so one of the two ends has to be converted — and the ascent that converts
 * them is a property of the face at that size, which nothing in CSS exposes. A
 * zero-size inline-block aligned to the baseline reports it exactly.
 */
function baselineIn(el: HTMLElement): number {
  const i = document.createElement("i");
  i.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  el.appendChild(i);
  const top = el.getBoundingClientRect().top;
  const at = i.getBoundingClientRect().top - top;
  i.remove();
  return at;
}

/* ── Mount ───────────────────────────────────────────────────────────── */

/** Append the layer INTO the stage (idempotent under Strict Mode's double
 *  effect). Absolute over the stage's own box, so its poses are the stage's. */
export function mountSeamLayer(stage: HTMLElement): HTMLElement {
  const existing = stage.querySelector<HTMLElement>(":scope > .tl-seam");
  if (existing) return existing;
  const layer = document.createElement("div");
  layer.className = "tl-seam";
  layer.setAttribute("aria-hidden", "true");
  layer.hidden = true;
  for (let i = 0; i < CARRIERS; i++) {
    const c = document.createElement("div");
    c.className = "tl-seam__carrier";
    if (i === 0) c.dataset.lead = "";
    c.dataset.i = String(i);
    c.hidden = true;
    const rule = document.createElement("i");
    rule.className = "tl-seam__rule";
    const kicker = document.createElement("span");
    kicker.className = "tl-seam__kicker";
    const name = document.createElement("span");
    name.className = "tl-seam__name";
    c.append(rule, kicker, name);
    layer.appendChild(c);
  }
  stage.appendChild(layer);
  return layer;
}

/* ── Measure ─────────────────────────────────────────────────────────── */

/** A box relative to the stage's own, from two rects read in one frame. */
const inStage = (r: DOMRect, stage: DOMRect): SeamRect => ({
  x: r.left - stage.left,
  y: r.top - stage.top,
  w: r.width,
  h: r.height,
});

/**
 * Everything that changes only when the page re-lays-out.
 *
 * Returns null until the board and all three plates exist inside the stage —
 * the configuration is a lazy nested root, and a seam with nothing to carry
 * has to be a NO-OP rather than a layer holding three boxes over an empty
 * stage.
 */
export function measureSeam(
  layer: HTMLElement,
  root: HTMLElement,
  stage: HTMLElement
): SeamMeasure | null {
  const board = root.querySelector<HTMLElement>("#proposition .arc-board");
  const svg = root.querySelector<SVGSVGElement>(
    '#proposition [data-board-state="configured"] .arc-board__svg'
  );
  const plateEl = svg?.querySelector<SVGGraphicsElement>(
    '[data-board-module="card"] .arc-board__plate'
  );
  const chipText = svg
    ? [...svg.querySelectorAll<SVGGraphicsElement>('[data-board-role="card"] text')]
    : [];
  const phases = root.querySelector<HTMLElement>("#proposition #phases");
  const plates = phases ? [...phases.querySelectorAll<HTMLElement>(".arc-plate")] : [];
  const heads = plates.map((p) => p.querySelector<HTMLElement>(".arc-plate__head"));
  if (
    !board ||
    !svg ||
    !plateEl ||
    !phases ||
    chipText.length < 2 ||
    plates.length !== CARRIERS ||
    heads.some((h) => !h)
  ) {
    return null;
  }

  const vbv = svg.viewBox.baseVal;
  const vb = { w: vbv.width, h: vbv.height };
  const svgBox = svg.getBoundingClientRect();
  const fit = fitCropMid({ w: svgBox.width, h: svgBox.height }, vb);
  const cb = plateEl.getBBox();
  const chip: SeamRect = { x: cb.x, y: cb.y, w: cb.width, h: cb.height };

  const els = [...layer.querySelectorAll<HTMLElement>(".tl-seam__carrier")];
  /* ⚠ THE LAYER HAS TO BE LAID OUT TO BE MEASURED. It rests at `hidden`, i.e.
     `display: none`, where every rect is zero and `baselineIn` reports 0 — which
     places each span's BOX top on the chip's BASELINE and drops its text ~19px,
     measured. Nothing errors and nothing else moves; it reads as the words
     having been placed by eye. Un-hidden for the measurement, restored after. */
  const wasHidden = layer.hidden;
  const carrierHidden = els.map((el) => el.hidden);
  layer.hidden = false;
  for (const el of els) el.hidden = false;
  const stageBox = stage.getBoundingClientRect();
  /* The plate's own cut, resolved: it is a `clamp()`, so the string is useless
     and `parseFloat` reads its floor. */
  const chPlate = resolveLen(plates[0], "--arc-plate-ch");
  const edgeChip = rgba(resolveColor(board, "--arc-board-gold-line", "rgb(202,165,84)"));
  const edgePlate = rgba(resolveColor(plates[0], "--arc-edge", "rgba(235,227,214,0.08)"));

  /** A head band's two spans, posed inside their own band's box. */
  const spansOf = (head: HTMLElement) => {
    const hb = head.getBoundingClientRect();
    return [
      head.querySelector<HTMLElement>(".arc-plate__kicker"),
      head.querySelector<HTMLElement>(".arc-plate__name"),
    ].map((span) => {
      const sb = span ? span.getBoundingClientRect() : hb;
      const cs = span ? getComputedStyle(span) : getComputedStyle(head);
      return {
        pose: {
          x: sb.left - hb.left,
          y: sb.top - hb.top,
          fs: parseFloat(cs.fontSize),
          ls: trackPx(cs.letterSpacing),
        } as Pose,
        text: span?.textContent ?? "",
        ink: rgba(cs.color),
      };
    });
  };

  const carriers: Carrier[] = els.map((el, i) => {
    const dstHead = heads[i]!;
    const to = inStage(dstHead.getBoundingClientRect(), stageBox);
    const dst = spansOf(dstHead);
    const leafEls = [
      el.querySelector<HTMLElement>(".tl-seam__kicker")!,
      el.querySelector<HTMLElement>(".tl-seam__name")!,
    ];
    /* Carrier 0 starts as the CHIP: its two words are SVG `<text>` on their
       baseline, so each is converted to a span placed by its box top. The two
       copies start as the band they peel off, which is HTML already. */
    const src = i === 0 ? null : spansOf(heads[i - 1]!);
    const leaves: Leaf[] = leafEls.map((leaf, k) => {
      let a: Pose;
      let fromText: string;
      let inkA: number[];
      if (src) {
        a = src[k].pose;
        fromText = src[k].text;
        inkA = src[k].ink;
      } else {
        const glyph = chipText[k];
        const sb = glyph.getBBox();
        const srcCs = getComputedStyle(glyph);
        const srcFs = parseFloat(srcCs.fontSize) * fit.k;
        const srcTrack = (parseFloat(srcCs.letterSpacing) || 0) * fit.k;
        /* The chip's word is on its BASELINE; the carrier's span is placed by
           its box top, so the baseline the span WOULD have at that size is
           measured and subtracted. The `y` attribute is the baseline itself. */
        const srcBaseline = (Number(glyph.getAttribute("y")) || sb.y + sb.height) - chip.y;
        leaf.style.fontSize = `${srcFs}px`;
        leaf.style.letterSpacing = `${srcTrack}px`;
        a = {
          x: (sb.x - chip.x) * fit.k,
          y: srcBaseline * fit.k - baselineIn(leaf),
          fs: srcFs,
          ls: srcTrack,
        };
        fromText = glyph.textContent ?? "";
        inkA = rgba(srcCs.fill && srcCs.fill !== "none" ? srcCs.fill : srcCs.color);
      }
      return {
        el: leaf,
        a,
        b: dst[k].pose,
        pair: { from: fromText, to: dst[k].text },
        inkA,
        inkB: dst[k].ink,
      };
    });
    return {
      el,
      leaves,
      from: i === 0 ? null : inStage(heads[i - 1]!.getBoundingClientRect(), stageBox),
      to,
      chA: i === 0 ? null : chPlate,
      chB: chPlate,
      edgeA: i === 0 ? edgeChip : edgePlate,
      edgeB: edgePlate,
      wall: seamWall(leaves.map((l) => l.pair)),
    };
  });

  layer.hidden = wasHidden;
  els.forEach((el, i) => {
    el.hidden = carrierHidden[i];
  });

  /* The material, written once onto the layer: the chip's three fills, the
     head's divider, and the gold rule across its top. */
  layer.style.setProperty(
    "--tl-seam-plate",
    resolveColor(board, "--arc-board-plate", "rgba(10,9,8,0.55)")
  );
  layer.style.setProperty(
    "--tl-seam-sheen",
    resolveColor(board, "--arc-board-sheen", "rgba(235,227,214,0.03)")
  );
  layer.style.setProperty(
    "--tl-seam-wash",
    resolveColor(board, "--arc-board-gold-wash", "rgba(202,165,84,0.12)")
  );
  layer.style.setProperty(
    "--tl-seam-seam",
    resolveColor(plates[0], "--arc-seam", "rgba(235,227,214,0.28)")
  );
  layer.style.setProperty(
    "--tl-seam-rule",
    resolveColor(plates[0], "--gold-line", "rgba(202,165,84,0.34)")
  );

  return { svg, vb, chip, carriers };
}

/* ── Write ───────────────────────────────────────────────────────────── */

/**
 * One frame, at scene clock `sv`.
 *
 * `svgRect` and `stageRect` are passed in rather than read here: the writer
 * takes every rect it needs at the top of its own frame, before the first style
 * write, and a second read in here would buy a forced synchronous layout per
 * frame for nothing. The chip's box is solved from the svg's LIVE rect, the
 * heads' from the boxes measured at relayout — all of them stationary while the
 * stage is pinned, which is the premise of the whole layer.
 */
export function writeSeam(
  layer: HTMLElement,
  m: SeamMeasure,
  sv: number,
  svgRect: DOMRect,
  stageRect: DOMRect
): void {
  const fit = fitCropMid({ w: svgRect.width, h: svgRect.height }, m.vb);
  const chip: SeamRect = {
    x: svgRect.left - stageRect.left + fit.ox + m.chip.x * fit.k,
    y: svgRect.top - stageRect.top + fit.oy + m.chip.y * fit.k,
    w: m.chip.w * fit.k,
    h: m.chip.h * fit.k,
  };

  let any = false;
  for (let i = 0; i < m.carriers.length; i++) {
    const c = m.carriers[i];
    const { e, live } = carrierWindow(i, sv);
    const el = c.el;
    if (!live) {
      if (!el.hidden) el.hidden = true;
      continue;
    }
    any = true;
    if (el.hidden) el.hidden = false;
    const from = c.from ?? chip;
    const r = lerpRect(from, c.to, e);
    const chA = c.chA ?? SEAM_CHIP_CUT * fit.k;
    const ch = chA + (c.chB - chA) * e;
    el.style.setProperty("--x", `${r.x.toFixed(2)}px`);
    el.style.setProperty("--y", `${r.y.toFixed(2)}px`);
    el.style.setProperty("--w", `${r.w.toFixed(2)}px`);
    el.style.setProperty("--h", `${r.h.toFixed(2)}px`);
    el.style.setProperty("--ch", `${ch.toFixed(2)}px`);
    el.style.setProperty("--edge", mixRgba(c.edgeA, c.edgeB, e));
    /* The words hold until the carrier has visibly separated from what it
       peeled off, decode in flight, and land before the box does — see
       `decodeClock` for both ends and why. */
    const u = decodeClock(e);
    for (const leaf of c.leaves) {
      const x = leaf.a.x + (leaf.b.x - leaf.a.x) * e;
      const y = leaf.a.y + (leaf.b.y - leaf.a.y) * e;
      const fs = leaf.a.fs + (leaf.b.fs - leaf.a.fs) * e;
      const ls = leaf.a.ls + (leaf.b.ls - leaf.a.ls) * e;
      leaf.el.style.setProperty("--tx", `${x.toFixed(2)}px`);
      leaf.el.style.setProperty("--ty", `${y.toFixed(2)}px`);
      leaf.el.style.fontSize = `${fs.toFixed(2)}px`;
      leaf.el.style.letterSpacing = `${ls.toFixed(3)}px`;
      leaf.el.style.color = mixRgba(leaf.inkA, leaf.inkB, e);
      const next = seamDecodeFrame(leaf.pair, u, c.wall);
      if (leaf.el.textContent !== next) leaf.el.textContent = next;
    }
  }
  if (layer.hidden === any) layer.hidden = !any;
}

/** Put the layer away. */
export function parkSeam(layer: HTMLElement | null): void {
  if (!layer) return;
  layer.hidden = true;
  for (const el of layer.querySelectorAll<HTMLElement>(".tl-seam__carrier")) el.hidden = true;
}

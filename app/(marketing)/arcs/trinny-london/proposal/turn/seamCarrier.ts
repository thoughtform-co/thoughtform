/**
 * seamCarrier — the chip becomes the three plate head bands (ADR-101 §B).
 *
 * Owner, 2026-09-14: _"The AI capability card at the center moves into the
 * center of the screen, and then it copies itself left and right. That becomes
 * the cards from the 'We propose a modular approach' section … I don't want
 * fucking cross-dissolves. This really needs to be an elegant transformation of
 * the element."_
 *
 * So there is no dissolve anywhere in here. One object detaches from the board,
 * glides to the frame's centre, copies itself, peels to the plates' columns and
 * lands as their head bands — changing its box, its corner cut, its edge colour
 * and its two words on the way, all summed into one expression of the seam
 * clock `t` (`seamCarrierRect`). What is HIDDEN rather than faded is the chip it
 * left (its outline stays, dashed, as the socket the ribbons still meet) and the
 * heads it is about to become.
 *
 * ⚠ THE LAYER IS ABSOLUTE IN DOCUMENT SPACE, NOT FIXED, and that is the whole
 * reason the two welds are exact. The chip and the heads are both glued to the
 * page; a `fixed` carrier is composited against the VIEWPORT, so a frame this
 * writer misses leaves it hanging where the scroll used to be while the things
 * it is welding to have moved. Absolute, it misses the same frame glued to the
 * same page.
 *
 * ⚠ AND IT IS APPENDED TO `document.body`. An absolutely positioned element
 * whose containing block is the initial one is in document space and scrolls
 * with the page — which is what is wanted — and the alternative (giving
 * `.tl-root` a `position`) would silently re-home every absolutely positioned
 * descendant of the page root. The route's sheet styles it by class; a
 * stylesheet is document-global once loaded, and `.tl-seam` exists nowhere else.
 *
 * ⚠ EVERY COLOUR AND EVERY LENGTH IS RESOLVED THROUGH A PROBE, never read with
 * `getPropertyValue`. A custom property is a STRING until something lays it out
 * (`--arc-plate-ch` is a `clamp()`; `--arc-edge` is `rgba(var(--dawn-rgb), …)`),
 * and this layer sits outside `.arc-root`, where none of those tokens resolve.
 * The probe goes inside the element that OWNS the token and reports the pixel.
 */

import {
  clamp01,
  fitCropMid,
  seamCarrierRect,
  seamSeat,
  SEAM_CHIP_CUT,
  SEAM_DETACH_END,
  type SeamRect,
} from "./turnClock";
import { seamDecodeFrame, seamWall, type SeamPair } from "./seamDecode";

const CARRIERS = 3;
/** The plate whose column IS the frame's centre, so it holds still through the
 *  split and is the one carrier the detach shows (measured at 1920×1247: its
 *  centre is 956.95 against a client width of 1914). */
const MID = 1;

interface Leaf {
  el: HTMLElement;
  /** Pose at the chip end and at the head end, px in the carrier's own box. */
  a: { x: number; y: number; fs: number; ls: string };
  b: { x: number; y: number; fs: number; ls: string };
  pair: SeamPair;
  /** The ink at each end, as resolved colour strings. */
  inkA: string;
  inkB: string;
}

interface Carrier {
  el: HTMLElement;
  leaves: Leaf[];
  /** The head's box inside `#phases`, transform-free. */
  head: SeamRect;
}

export interface SeamMeasure {
  svg: SVGSVGElement;
  vb: { w: number; h: number };
  /** The chip's box in the board's own user units. */
  chip: SeamRect;
  phases: HTMLElement;
  carriers: Carrier[];
  wall: number;
  /** The corner cut at each end, in px. */
  chA: number;
  chB: number;
  /** The edge colour at each end, as RGBA quadruples. */
  edgeA: number[];
  edgeB: number[];
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

/** Append the layer (idempotent under Strict Mode's double effect). */
export function mountSeamLayer(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(".tl-seam");
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
    const rule = document.createElement("i");
    rule.className = "tl-seam__rule";
    const kicker = document.createElement("span");
    kicker.className = "tl-seam__kicker";
    const name = document.createElement("span");
    name.className = "tl-seam__name";
    c.append(rule, kicker, name);
    layer.appendChild(c);
  }
  document.body.appendChild(layer);
  return layer;
}

/* ── Measure ─────────────────────────────────────────────────────────── */

/**
 * Everything that changes only when the page re-lays-out.
 *
 * Returns null until the board and all three plates exist — both are lazy
 * nested roots, and a seam with nothing to carry has to be a NO-OP rather than
 * a layer holding three boxes over an empty page.
 */
export function measureSeam(layer: HTMLElement, root: HTMLElement): SeamMeasure | null {
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
  const phases = root.querySelector<HTMLElement>("#phases");
  const plates = phases ? [...phases.querySelectorAll<HTMLElement>(".arc-plate")] : [];
  if (!board || !svg || !plateEl || !phases || chipText.length < 2 || plates.length !== CARRIERS) {
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
  const phasesBox = phases.getBoundingClientRect();
  /* The plate's own cut, resolved: it is a `clamp()`, so the string is useless
     and `parseFloat` reads its floor. */
  const chB = resolveLen(plates[0], "--arc-plate-ch");
  const edgeA = rgba(resolveColor(board, "--arc-board-gold-line", "rgb(202,165,84)"));
  const edgeB = rgba(resolveColor(plates[0], "--arc-edge", "rgba(235,227,214,0.08)"));

  const carriers: Carrier[] = els.map((el, i) => {
    const plate = plates[i];
    const headEl = plate.querySelector<HTMLElement>(".arc-plate__head")!;
    const hb = headEl.getBoundingClientRect();
    const head: SeamRect = {
      x: hb.left - phasesBox.left,
      y: hb.top - phasesBox.top,
      w: hb.width,
      h: hb.height,
    };
    const targets = [
      headEl.querySelector<HTMLElement>(".arc-plate__kicker"),
      headEl.querySelector<HTMLElement>(".arc-plate__name"),
    ];
    const leafEls = [
      el.querySelector<HTMLElement>(".tl-seam__kicker")!,
      el.querySelector<HTMLElement>(".tl-seam__name")!,
    ];
    const leaves: Leaf[] = leafEls.map((leaf, k) => {
      const src = chipText[k];
      const sb = src.getBBox();
      const srcCs = getComputedStyle(src);
      const srcFs = parseFloat(srcCs.fontSize) * fit.k;
      const srcTrack = parseFloat(srcCs.letterSpacing) || 0;
      const tgt = targets[k];
      const tb = tgt ? tgt.getBoundingClientRect() : hb;
      const tgtCs = tgt ? getComputedStyle(tgt) : getComputedStyle(headEl);
      /* The chip's word is on its BASELINE; the carrier's span is placed by
         its box top, so the baseline the span WOULD have at that size is
         measured and subtracted. `getBBox().y` is the ink's top, and the
         baseline is one ascent below it — but the ascent is the face's, so
         the `y` attribute is used directly instead. */
      const srcBaseline = (Number(src.getAttribute("y")) || sb.y + sb.height) - chip.y;
      leaf.style.fontSize = `${srcFs}px`;
      leaf.style.letterSpacing = `${srcTrack * fit.k}px`;
      const aTop = srcBaseline * fit.k - baselineIn(leaf);
      return {
        el: leaf,
        a: {
          x: (sb.x - chip.x) * fit.k,
          y: aTop,
          fs: srcFs,
          ls: `${srcTrack * fit.k}px`,
        },
        b: {
          x: tb.left - hb.left,
          y: tb.top - hb.top,
          fs: parseFloat(tgtCs.fontSize),
          ls: tgtCs.letterSpacing === "normal" ? "0px" : tgtCs.letterSpacing,
        },
        pair: { from: src.textContent ?? "", to: tgt?.textContent ?? "" },
        inkA: srcCs.fill && srcCs.fill !== "none" ? srcCs.fill : srcCs.color,
        inkB: tgtCs.color,
      };
    });
    return { el, leaves, head };
  });

  layer.hidden = wasHidden;
  els.forEach((el, i) => {
    el.hidden = carrierHidden[i];
  });

  const pairs = carriers.flatMap((c) => c.leaves.map((l) => l.pair));
  const wall = seamWall(pairs);

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

  return {
    svg,
    vb,
    chip,
    phases,
    carriers,
    wall,
    chA: SEAM_CHIP_CUT * fit.k,
    chB,
    edgeA,
    edgeB,
  };
}

/* ── Write ───────────────────────────────────────────────────────────── */

/**
 * One frame.
 *
 * `svgRect` and `phasesRect` are passed in rather than read here: this writer
 * takes every rect it needs at the top of its own frame, before the first style
 * write, and a second read in here would buy a forced synchronous layout per
 * frame for nothing.
 */
export function writeSeam(
  layer: HTMLElement,
  m: SeamMeasure,
  t: number,
  svgRect: DOMRect,
  phasesRect: DOMRect,
  scrollY: number
): void {
  if (t <= 0 || t >= 1) {
    if (!layer.hidden) layer.hidden = true;
    return;
  }
  if (layer.hidden) layer.hidden = false;

  const fit = fitCropMid({ w: svgRect.width, h: svgRect.height }, m.vb);
  /* The chip's box in DOCUMENT space — the layer's own coordinate system, so a
     frame this writer misses leaves the carrier glued to the page exactly as
     the chip and the heads are. */
  const chip: SeamRect = {
    x: svgRect.left + fit.ox + m.chip.x * fit.k,
    y: svgRect.top + scrollY + fit.oy + m.chip.y * fit.k,
    w: m.chip.w * fit.k,
    h: m.chip.h * fit.k,
  };
  /* ⚠ `clientWidth`, NEVER `innerWidth` — the second includes the scrollbar,
     and a centre half a scrollbar off is a centre the reader can see is off. */
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const centre: SeamRect = {
    x: vw / 2 - chip.w / 2,
    y: scrollY + vh / 2 - chip.h / 2,
    w: chip.w,
    h: chip.h,
  };

  const e3 = seamSeat(t);
  /* ⚠ THE WORDS LAND BEFORE THE BOX DOES. `seamDecodeFrame` is exact at its
     ends, so at `u` 0.999 it is still shuffling a glyph — and the frame the
     layer hands over to the real heads would carry one wrong letter. Finishing
     the decode at 90 % of the seat leaves the last stretch a pure geometry
     move, which is also the easier thing to read. */
  const u = clamp01(e3 / 0.9);
  const ch = m.chA + (m.chB - m.chA) * e3;
  const edge = mixRgba(m.edgeA, m.edgeB, e3);
  const show = t >= SEAM_DETACH_END;

  for (let i = 0; i < m.carriers.length; i++) {
    const c = m.carriers[i];
    const head: SeamRect = {
      x: phasesRect.left + c.head.x,
      y: phasesRect.top + scrollY + c.head.y,
      w: c.head.w,
      h: c.head.h,
    };
    /* The park: chip-sized, on the head's own column centre and the frame's
       vertical middle — so the split is a pure lateral peel and the middle
       carrier does not move at all. */
    const park: SeamRect = {
      x: head.x + head.w / 2 - chip.w / 2,
      y: centre.y,
      w: chip.w,
      h: chip.h,
    };
    const r = seamCarrierRect(t, chip, centre, park, head);
    const el = c.el;
    if (!show && i !== MID) {
      if (!el.hidden) el.hidden = true;
      continue;
    }
    if (el.hidden) el.hidden = false;
    el.style.setProperty("--x", `${r.x.toFixed(2)}px`);
    el.style.setProperty("--y", `${r.y.toFixed(2)}px`);
    el.style.setProperty("--w", `${r.w.toFixed(2)}px`);
    el.style.setProperty("--h", `${r.h.toFixed(2)}px`);
    el.style.setProperty("--ch", `${ch.toFixed(2)}px`);
    el.style.setProperty("--edge", edge);
    for (const leaf of c.leaves) {
      const x = leaf.a.x + (leaf.b.x - leaf.a.x) * e3;
      const y = leaf.a.y + (leaf.b.y - leaf.a.y) * e3;
      const fs = leaf.a.fs + (leaf.b.fs - leaf.a.fs) * e3;
      const lsA = parseFloat(leaf.a.ls) || 0;
      const lsB = parseFloat(leaf.b.ls) || 0;
      leaf.el.style.setProperty("--tx", `${x.toFixed(2)}px`);
      leaf.el.style.setProperty("--ty", `${y.toFixed(2)}px`);
      leaf.el.style.fontSize = `${fs.toFixed(2)}px`;
      leaf.el.style.letterSpacing = `${(lsA + (lsB - lsA) * e3).toFixed(3)}px`;
      leaf.el.style.color = mixRgba(rgba(leaf.inkA), rgba(leaf.inkB), e3);
      const next = seamDecodeFrame(leaf.pair, u, m.wall);
      if (leaf.el.textContent !== next) leaf.el.textContent = next;
    }
  }
}

/** Put the layer away and restore every line to its own end state. */
export function parkSeam(layer: HTMLElement | null): void {
  if (!layer) return;
  layer.hidden = true;
  for (const el of layer.querySelectorAll<HTMLElement>(".tl-seam__carrier")) el.hidden = true;
}

/**
 * The lattice's ONE measurement (ADR-149 §4): what the lab prints in its
 * legend and its console, and what `scripts/capture-lattice.mjs` asserts on
 * through `window.__lattice.measure()`.
 *
 * Pure DOM, no React, no imports. Everything is read off the LIVE page:
 *
 *   · a rung's `y` comes from a PROBE — a fixed, zero-size element given
 *     `top: var(--lat-rung-N)` and laid out — because a custom property is a
 *     STRING until something lays it out (`getPropertyValue` hands back the
 *     `calc()` text and `parseFloat` returns NaN; ADR-091's own trap);
 *   · its `tick` is the Nth `#leftTicks .hud__rail__tick`'s rect centre — the
 *     frame's own ladder, which the script cannot set and the token cannot
 *     see. The two agreeing to 1.5px is what "seated on the rail" means;
 *   · a column edge's `x` comes from the same probe idiom over
 *     `calc(var(--lat-margin) + var(--lat-col) * N)`; its `expected` is the
 *     SAME edge re-derived in JS from the margin probe and the viewport width
 *     alone, so the token chain (`--lat-col`'s `100vw` arithmetic) is checked
 *     against a second derivation rather than against itself;
 *   · every `.lat-frame`'s four edges are snapped to the nearest rung and the
 *     nearest column, with the distance kept, so an edge that is NOT seated
 *     is reported as a number rather than hidden by a boolean.
 *
 * Tolerances are the ADR's: rungs 1.5px, columns 1px. `seated` counts what
 * agrees; `framesOff` names what does not. On a flowing board (sections, page)
 * the frames are not expected on the rungs and the capture does not ask.
 */

export const LATTICE_RUNGS = 13;
export const LATTICE_COLUMN_EDGES = 13;
export const RUNG_TOLERANCE_PX = 1.5;
export const COLUMN_TOLERANCE_PX = 1;

export interface LatticeColumn {
  n: number;
  /** the token chain laid out: `--lat-margin + --lat-col * n` */
  x: number;
  /** the same edge re-derived from the margin and the viewport width */
  expected: number;
  delta: number;
}

export interface LatticeRungRead {
  n: number;
  /** `--lat-rung-N`, laid out */
  y: number;
  /** the Nth left-rail tick's centre, or NaN when the rail is absent */
  tick: number;
  delta: number;
}

export interface LatticeFrameRead {
  id: string;
  spec: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
  topRung: number;
  topDelta: number;
  bottomRung: number;
  bottomDelta: number;
  leftCol: number;
  leftDelta: number;
  rightCol: number;
  rightDelta: number;
}

export interface LatticeReport {
  columns: LatticeColumn[];
  rungs: LatticeRungRead[];
  frames: LatticeFrameRead[];
  /** how many `#leftTicks .hud__rail__tick` the frame drew (13 on the landing's rail) */
  ticks: number;
  /** `.hud__rail`'s live height, 0 without the frame */
  rail: number;
  seated: {
    columns: number;
    rungs: number;
    framesOff: string[];
  };
}

/** Lay a length out and read it. The element is appended, measured, removed. */
function probe(doc: Document, style: Partial<CSSStyleDeclaration>): DOMRect {
  const el = doc.createElement("div");
  el.setAttribute("data-lat-probe", "");
  el.style.position = "fixed";
  el.style.left = "0px";
  el.style.top = "0px";
  el.style.width = "0px";
  el.style.height = "0px";
  el.style.margin = "0";
  el.style.padding = "0";
  el.style.border = "0";
  el.style.pointerEvents = "none";
  el.style.visibility = "hidden";
  Object.assign(el.style, style);
  doc.body.appendChild(el);
  const r = el.getBoundingClientRect();
  el.remove();
  return r;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function nearest(value: number, ladder: number[]): { index: number; delta: number } {
  let index = -1;
  let delta = Number.POSITIVE_INFINITY;
  ladder.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const d = Math.abs(value - v);
    if (d < delta) {
      delta = d;
      index = i;
    }
  });
  return { index, delta: Number.isFinite(delta) ? round2(delta) : Number.NaN };
}

export function measureLattice(doc: Document): LatticeReport {
  const win = doc.defaultView ?? window;

  /* ── The rail ─────────────────────────────────────────────────────── */
  const tickEls = Array.from(doc.querySelectorAll<HTMLElement>("#leftTicks .hud__rail__tick"));
  const ticks = tickEls.length;
  const railEl = doc.querySelector<HTMLElement>(".hud__rail");
  const rail = railEl ? Math.round(railEl.getBoundingClientRect().height) : 0;
  const tickYs = tickEls.map((t) => {
    const r = t.getBoundingClientRect();
    return r.top + r.height / 2;
  });

  /* ── The rungs ────────────────────────────────────────────────────── */
  const rungs: LatticeRungRead[] = [];
  for (let n = 0; n < LATTICE_RUNGS; n += 1) {
    const y = probe(doc, { top: `var(--lat-rung-${n})` }).top;
    const tick = n < tickYs.length ? tickYs[n] : Number.NaN;
    rungs.push({
      n,
      y: round2(y),
      tick: Number.isFinite(tick) ? round2(tick) : Number.NaN,
      delta: Number.isFinite(tick) ? round2(Math.abs(y - tick)) : Number.NaN,
    });
  }

  /* ── The columns ──────────────────────────────────────────────────── */
  const margin = probe(doc, { left: "var(--lat-margin)" }).left;
  const colsRaw = parseFloat(
    win.getComputedStyle(doc.documentElement).getPropertyValue("--lat-cols")
  );
  const cols = Number.isFinite(colsRaw) && colsRaw > 0 ? colsRaw : 12;
  /* ⚠ NEVER `--lat-col` × N, and never `innerWidth`: both are `100vw`-based
     and include the scrollbar, so every column after the first drifted and the
     last landed 6px past the band on the first capture. The EDGE is N/cols of
     the band's rendered box — read off the first `.lat-band` (its padding box
     minus its padding) when one is mounted, else off the document's client
     width minus the margin — and the PROBE is the same fraction of its
     containing block, which is what the overlay and the grid lay out against. */
  const band = doc.querySelector<HTMLElement>(".lat-band");
  let bandLeft = margin;
  let bandWidth = doc.documentElement.clientWidth - 2 * margin;
  if (band) {
    const r = band.getBoundingClientRect();
    const cs = win.getComputedStyle(band);
    bandLeft = r.left + parseFloat(cs.paddingLeft);
    bandWidth = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }
  const colW = bandWidth / cols;
  const columns: LatticeColumn[] = [];
  for (let n = 0; n < LATTICE_COLUMN_EDGES; n += 1) {
    const x = probe(doc, {
      left: `calc(var(--lat-margin) + (100% - 2 * var(--lat-margin)) * ${n} / var(--lat-cols))`,
    }).left;
    const expected = bandLeft + colW * n;
    columns.push({
      n,
      x: round2(x),
      expected: round2(expected),
      delta: round2(Math.abs(x - expected)),
    });
  }
  const columnXs = columns.map((c) => c.x);
  const rungYs = rungs.map((r) => r.y);

  /* ── The frames ───────────────────────────────────────────────────── */
  const frames: LatticeFrameRead[] = Array.from(
    doc.querySelectorAll<HTMLElement>(".lat-frame")
  ).map((el, i) => {
    const r = el.getBoundingClientRect();
    const top = nearest(r.top, rungYs);
    const bottom = nearest(r.bottom, rungYs);
    const left = nearest(r.left, columnXs);
    const right = nearest(r.right, columnXs);
    return {
      id: el.id || `frame-${i}`,
      spec: el.getAttribute("data-spec") ?? (el.id ? el.id.replace(/^lat-frame-/, "") : ""),
      top: round2(r.top),
      bottom: round2(r.bottom),
      left: round2(r.left),
      right: round2(r.right),
      topRung: top.index,
      topDelta: top.delta,
      bottomRung: bottom.index,
      bottomDelta: bottom.delta,
      leftCol: left.index,
      leftDelta: left.delta,
      rightCol: right.index,
      rightDelta: right.delta,
    };
  });

  const seatedColumns = columns.filter((c) => c.delta <= COLUMN_TOLERANCE_PX).length;
  const seatedRungs = rungs.filter((r) => r.delta <= RUNG_TOLERANCE_PX).length;
  const framesOff = frames
    .filter(
      (f) =>
        !(
          f.topDelta <= RUNG_TOLERANCE_PX &&
          f.bottomDelta <= RUNG_TOLERANCE_PX &&
          f.leftDelta <= COLUMN_TOLERANCE_PX &&
          f.rightDelta <= COLUMN_TOLERANCE_PX
        )
    )
    .map((f) => f.id);

  return {
    columns,
    rungs,
    frames,
    ticks,
    rail,
    seated: { columns: seatedColumns, rungs: seatedRungs, framesOff },
  };
}

/** The one-line summary the console prints: `cols 13/13 seated · rungs 13/13 · frames 0 off`. */
export function summariseLattice(r: LatticeReport): string {
  return [
    `cols ${r.seated.columns}/${r.columns.length} seated`,
    `rungs ${r.seated.rungs}/${r.rungs.length}`,
    `frames ${r.seated.framesOff.length} off`,
    `ticks ${r.ticks}`,
    `rail ${r.rail}`,
  ].join(" · ");
}

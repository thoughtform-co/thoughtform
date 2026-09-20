/**
 * decodeLayer — a layer of per-line LEAVES that decodes a host's runs in
 * place, scrubbed by a clock the caller owns (ADR-114; ADR-103's head
 * carrier, generalised for the phone's two bands).
 *
 * Why a layer and not the real text: a decoding run is wider than its
 * resting self (the shuffle's glyphs are mono caps against a proportional
 * face) and both phone bands CENTRE their copy, so writing `textContent`
 * re-centres the line on every frame. The layer holds one absolutely posed
 * leaf per RENDERED LINE, `white-space: nowrap`, dressed in the run's own
 * computed face, over the real text which the caller hides by `visibility`
 * for the length of the window — so nothing in layout moves and the ghost
 * keeps holding the box (the ServicesMasthead / ArcDecodeText law).
 *
 * REGISTER LAW: `scramble` runs (mono chrome, the display title) go through
 * the kernel line by line; `type` runs (prose) are one typewriter over the
 * whole run — every leaf shows its own slice of one character count, so a
 * three-line paragraph types as three lines that stay three lines.
 *
 * ⚠ MEASURE WITH THE HOST'S BOX. Leaves are absolute inside the host (a
 * sticky band), so their poses are host-relative and survive the scroll;
 * they go stale on RESIZE and on a LAYOUT CHANGE inside the band (the
 * chevron), which is when the caller re-measures.
 *
 * DOM-only: no three, no scroll reads, no `getPropertyValue`.
 */

import { dress, textRuns, type Line } from "@/lib/home-v2/lineLeaves";
import {
  runSlice,
  scrambleLinesIn,
  scrambleLinesOut,
  typeCount,
  untypeCount,
} from "@/lib/home-v2/scrubbedDecode";

export type DecodeMode = "scramble" | "type";

export interface DecodeRunSpec {
  /** The element whose text nodes are the run (a title, a paragraph). */
  el: HTMLElement;
  mode: DecodeMode;
}

interface Leaf {
  el: HTMLElement;
  text: string;
  /** Character offset of this leaf's first character in the whole run. */
  off: number;
}

export interface DecodeRun {
  spec: DecodeRunSpec;
  leaves: Leaf[];
  /** The leaves' texts in order — the `finals` a scramble walks. */
  lines: string[];
  /** Total characters across the run (the typewriter's count). */
  len: number;
}

export interface DecodeLayer {
  el: HTMLElement;
  runs: DecodeRun[];
}

/** Append the layer INTO the host (idempotent under Strict Mode's double
 *  effect). Absolute over the host's own box, so its poses are the host's. */
export function mountDecodeLayer(host: HTMLElement, className: string): DecodeLayer {
  let el = host.querySelector<HTMLElement>(`:scope > .${className}`);
  if (!el) {
    el = document.createElement("div");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    el.hidden = true;
    host.appendChild(el);
  }
  return { el, runs: [] };
}

/**
 * Rebuild the leaves for `specs` against the host's current layout. The
 * host's own rect is the origin; a `Range` rect is the content area, so the
 * half-leading comes off each leaf's top (the run's computed `line-height`).
 * Returns the runs in the order given; a run with no rendered text (hidden,
 * empty) has no leaves and decodes nothing.
 */
export function measureDecodeLayer(
  layer: DecodeLayer,
  host: HTMLElement,
  specs: readonly DecodeRunSpec[],
  leafClass: string
): void {
  const box = host.getBoundingClientRect();
  layer.el.replaceChildren();
  layer.runs = specs.map((spec) => {
    const leaves: Leaf[] = [];
    const lines: string[] = [];
    let off = 0;
    for (const run of textRuns(spec.el)) {
      const cs = getComputedStyle(run.el);
      const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      for (const line of run.lines) {
        const el = document.createElement("span");
        el.className = leafClass;
        el.hidden = true;
        dress(el, cs);
        el.style.setProperty("--x", `${(line.left - box.left).toFixed(2)}px`);
        el.style.setProperty(
          "--y",
          `${(line.top - box.top - (lineHeight - line.height) / 2).toFixed(2)}px`
        );
        layer.el.appendChild(el);
        leaves.push({ el, text: line.text, off });
        lines.push(line.text);
        off += line.text.length + 1; // the break the browser made is a space in the count
      }
    }
    return { spec, leaves, lines, len: Math.max(0, off - 1) };
  });
}

/**
 * Paint one run at `u` in `direction` (`in`: 0 = blank → 1 = whole; `out`:
 * 0 = whole → 1 = blank), or hide it when the window is shut. The caller
 * decides visibility of the REAL text; this only paints leaves.
 */
export function writeDecodeRun(
  run: DecodeRun,
  u: number,
  direction: "in" | "out",
  live: boolean,
  random: () => number = Math.random
): void {
  if (!live) {
    for (const leaf of run.leaves) if (!leaf.el.hidden) leaf.el.hidden = true;
    return;
  }
  if (run.spec.mode === "type") {
    const count = direction === "in" ? typeCount(run.len, u) : untypeCount(run.len, u);
    for (const leaf of run.leaves) {
      if (leaf.el.hidden) leaf.el.hidden = false;
      const next = runSlice(leaf.text, leaf.off, count);
      if (leaf.el.textContent !== next) leaf.el.textContent = next;
    }
    return;
  }
  run.leaves.forEach((leaf, i) => {
    if (leaf.el.hidden) leaf.el.hidden = false;
    const next =
      direction === "in"
        ? scrambleLinesIn(run.lines, i, u, random)
        : scrambleLinesOut(run.lines, i, u, random);
    if (leaf.el.textContent !== next) leaf.el.textContent = next;
  });
}

/** Show or hide the whole layer — hidden whenever no run is live. */
export function setDecodeLayerLive(layer: DecodeLayer, live: boolean): void {
  if (layer.el.hidden === live) layer.el.hidden = !live;
}

/** Put the layer away and forget its leaves. */
export function unmountDecodeLayer(layer: DecodeLayer | null): void {
  if (!layer) return;
  layer.el.remove();
  layer.runs = [];
}

export type { Line };

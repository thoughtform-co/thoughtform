"use client";

import { useCallback, useEffect, useState } from "react";

import {
  MONO_ADVANCE,
  STAMP,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";

/**
 * THE FIT READOUT — what turns this lab into a measuring instrument.
 *
 * SVG `<text>` does not wrap, does not ellipsise and does not report its own
 * overflow. A label past its crop simply vanishes at the edge with nothing on
 * screen to say it happened, which is exactly how nine defects shipped past a
 * visual review of the isometric city. So the lab measures rather than
 * showing: every glyph box, every frame.
 *
 * ⚠ COMPARISONS ARE IN SVG USER UNITS, via `getBBox()`.
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two box
 * ratios, so `box.width / viewBox.width` over-reports whenever the crop and
 * the console disagree on aspect — it told the first measurement pass that a
 * 10.5px label was 12.5px. The one place a client rect is used is to derive
 * the single scale factor, and it takes the minimum.
 */

export interface FitReport {
  /** The canvas the SVG is laid into, in CSS pixels. */
  canvas: { w: number; h: number };
  /** The crop, in authoring units. */
  view: { x: number; y: number; w: number; h: number };
  /** Authoring units to CSS pixels. */
  scale: number;
  /** The sheet's type size in AUTHORING units (`--imap-type`). */
  typeUnits: number;
  /** How many monospace characters span the crop — the real budget. */
  charsAcross: number;
  texts: number;
  /** Smallest RENDERED type size on the sheet, in CSS pixels. */
  minPx: number;
  maxPx: number;
  /** Labels wholly or partly outside the crop — these are invisible on screen. */
  clipped: string[];
  /** Labels under the provenance stamp, which is DOM chrome over the drawing. */
  underStamp: string[];
  /**
   * Pairs of labels whose glyph boxes overlap each other.
   *
   * ⚠ THIS IS THE CHECK NOTHING ELSE ON THIS SURFACE MAKES, and it is the
   * owner's actual complaint. The city's smoke asserts crop containment and
   * stamp clearance — both of which its sheets pass — while its district
   * plaques letter straight through the plates and each other, because in an
   * isometric a label has no baseline to sit on and its position depends on
   * the whole scene rather than on its own object.
   */
  collisions: string[];
  /** Controls below the 10px chrome floor for an interactive element. */
  smallControls: string[];
  /** Whether the canvas scrolls, which it never should. */
  overflowX: number;
  overflowY: number;
}

const EMPTY: FitReport = {
  canvas: { w: 0, h: 0 },
  view: { x: 0, y: 0, w: 0, h: 0 },
  scale: 0,
  typeUnits: 0,
  charsAcross: 0,
  texts: 0,
  minPx: 0,
  maxPx: 0,
  clipped: [],
  underStamp: [],
  collisions: [],
  smallControls: [],
  overflowX: 0,
  overflowY: 0,
};

function measure(root: HTMLElement): FitReport {
  const svg = root.querySelector<SVGSVGElement>("svg.fl-imap__svg");
  const canvasEl = root.querySelector<HTMLElement>(".fl-imap__canvas");
  if (!svg || !canvasEl) return EMPTY;

  const [vx, vy, vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);
  const box = svg.getBoundingClientRect();
  const scale = Math.min(box.width / vw, box.height / vh);

  /* The stamp is DOM chrome pinned bottom-right in SCREEN pixels over an SVG
     that scales, so its footprint in AUTHORING units GROWS as the console
     shrinks. 1280×720 is the binding case and 1920 hides it entirely. */
  const offX = (box.width - vw * scale) / 2;
  const offY = (box.height - vh * scale) / 2;
  const stamp = {
    left: vx + (box.width - STAMP.rightPx - STAMP.wPx - offX) / scale,
    right: vx + (box.width - STAMP.rightPx - offX) / scale,
    top: vy + (box.height - STAMP.bottomPx - STAMP.hPx - offY) / scale,
    bottom: vy + (box.height - STAMP.bottomPx - offY) / scale,
  };

  const clipped: string[] = [];
  const underStamp: string[] = [];
  const collisions: string[] = [];
  const boxes: { label: string; x: number; y: number; w: number; h: number }[] = [];
  let minPx = Infinity;
  let maxPx = 0;
  let texts = 0;

  for (const node of Array.from(svg.querySelectorAll<SVGTextElement>("text"))) {
    const label = (node.textContent ?? "").trim();
    if (!label) continue;
    texts += 1;

    const bb = node.getBBox();
    boxes.push({ label, x: bb.x, y: bb.y, w: bb.width, h: bb.height });
    const px = parseFloat(getComputedStyle(node).fontSize) * scale;
    if (Number.isFinite(px)) {
      minPx = Math.min(minPx, px);
      maxPx = Math.max(maxPx, px);
    }

    const out =
      bb.x < vx - 0.5 ||
      bb.x + bb.width > vx + vw + 0.5 ||
      bb.y < vy - 0.5 ||
      bb.y + bb.height > vy + vh + 0.5;
    if (out) clipped.push(label);

    const hits =
      bb.x < stamp.right &&
      stamp.left < bb.x + bb.width &&
      bb.y < stamp.bottom &&
      stamp.top < bb.y + bb.height;
    if (hits) underStamp.push(label);
  }

  /* LABEL AGAINST LABEL. A tolerance of half a unit rather than zero: glyph
     boxes of adjacent lines can share a boundary exactly, and a shared edge
     is not an overlap. */
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (
        a.x < b.x + b.w - 0.5 &&
        b.x < a.x + a.w - 0.5 &&
        a.y < b.y + b.h - 0.5 &&
        b.y < a.y + a.h - 0.5
      ) {
        collisions.push(`${a.label.slice(0, 28)} × ${b.label.slice(0, 28)}`);
      }
    }
  }

  const smallControls: string[] = [];
  for (const control of Array.from(
    root.querySelectorAll<HTMLElement>(".fl-imap__tab, .fl-imap__action")
  )) {
    const px = parseFloat(getComputedStyle(control).fontSize);
    if (px < 9.4) smallControls.push(`${control.textContent?.trim().slice(0, 24)} @ ${px}px`);
  }

  /* `--imap-type` is set inline per sheet, in AUTHORING units — the number
     that decides how many characters a label can hold. Rendered size is that
     times the scale, which is why both are reported: a sheet can letter at a
     comfortable 11px and still have a 40-character budget for a 44-character
     label. */
  const typeUnits = parseFloat(svg.style.getPropertyValue("--imap-type")) || 0;

  return {
    canvas: { w: Math.round(canvasEl.clientWidth), h: Math.round(canvasEl.clientHeight) },
    view: { x: vx, y: vy, w: vw, h: vh },
    scale,
    typeUnits,
    charsAcross: typeUnits ? Math.floor(vw / (typeUnits * MONO_ADVANCE)) : 0,
    texts,
    minPx: texts ? minPx : 0,
    maxPx,
    clipped,
    underStamp,
    collisions,
    smallControls,
    overflowX: canvasEl.scrollWidth - canvasEl.clientWidth,
    overflowY: canvasEl.scrollHeight - canvasEl.clientHeight,
  };
}

/**
 * Re-measures after paint on every dependency change.
 *
 * Two frames, not one: the first lands after React commits, and fonts or a
 * theme flip can still move a glyph box on the next. The cost is nothing and
 * the alternative is a readout that reports the previous sheet's numbers.
 */
export function useFitReadout(ref: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  const [report, setReport] = useState<FitReport>(EMPTY);

  const run = useCallback(() => {
    if (ref.current) setReport(measure(ref.current));
  }, [ref]);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(run);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return { report, remeasure: run };
}

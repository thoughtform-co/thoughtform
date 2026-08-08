"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * THE FIT READOUT — what turns this lab into a measuring instrument.
 *
 * Retargeted from `/test/intelligence-map-lab`'s hook at the PDA console:
 * the svg is `.fl-pda__svg` inside the real `ConsoleFrame`, the canvas is
 * `.fl-con__field`, and there is no provenance stamp on this surface, so the
 * under-stamp check is gone. Everything else is the imlab law unchanged:
 *
 * SVG `<text>` does not wrap, does not ellipsise and does not report its own
 * overflow — a label past its crop simply vanishes with nothing on screen to
 * say so. So the lab measures rather than shows: every glyph box, every
 * frame, and every PAIR of glyph boxes, because label-on-label overlap is
 * the check nothing else on this surface makes.
 *
 * ⚠ COMPARISONS ARE IN SVG USER UNITS, via `getBBox()`.
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two box
 * ratios, so `box.width / viewBox.width` over-reports whenever the crop and
 * the console disagree on aspect.
 */

export interface ConfigFitReport {
  /** The console field the SVG is laid into, in CSS pixels. */
  canvas: { w: number; h: number };
  /** The crop, in authoring units. */
  view: { x: number; y: number; w: number; h: number };
  /** Authoring units to CSS pixels. */
  scale: number;
  texts: number;
  /** Smallest RENDERED type size on the drawing, in CSS pixels. */
  minPx: number;
  maxPx: number;
  /** Labels wholly or partly outside the crop — invisible on screen. */
  clipped: string[];
  /** Pairs of labels whose glyph boxes overlap each other. */
  collisions: string[];
  /** Rail stations under the 10px chrome floor for an interactive element. */
  smallControls: string[];
  /** Whether the field scrolls, which it never should. */
  overflowX: number;
  overflowY: number;
}

const EMPTY: ConfigFitReport = {
  canvas: { w: 0, h: 0 },
  view: { x: 0, y: 0, w: 0, h: 0 },
  scale: 0,
  texts: 0,
  minPx: 0,
  maxPx: 0,
  clipped: [],
  collisions: [],
  smallControls: [],
  overflowX: 0,
  overflowY: 0,
};

function measure(root: HTMLElement): ConfigFitReport {
  const svg = root.querySelector<SVGSVGElement>("svg.fl-pda__svg");
  const canvasEl = root.querySelector<HTMLElement>(".fl-con__field");
  if (!svg || !canvasEl) return EMPTY;

  const [vx, vy, vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);
  const box = svg.getBoundingClientRect();
  const scale = Math.min(box.width / vw, box.height / vh);

  const clipped: string[] = [];
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
  }

  /* LABEL AGAINST LABEL. Half a unit of tolerance rather than zero: glyph
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
  for (const control of Array.from(root.querySelectorAll<HTMLElement>(".fl-con__stn"))) {
    const px = parseFloat(getComputedStyle(control).fontSize);
    if (px < 9.4) smallControls.push(`${control.textContent?.trim().slice(0, 24)} @ ${px}px`);
  }

  return {
    canvas: { w: Math.round(canvasEl.clientWidth), h: Math.round(canvasEl.clientHeight) },
    view: { x: vx, y: vy, w: vw, h: vh },
    scale,
    texts,
    minPx: texts ? minPx : 0,
    maxPx,
    clipped,
    collisions,
    smallControls,
    overflowX: canvasEl.scrollWidth - canvasEl.clientWidth,
    overflowY: canvasEl.scrollHeight - canvasEl.clientHeight,
  };
}

/**
 * Re-measures after paint on every dependency change. Two frames, not one:
 * the first lands after React commits, and fonts or a theme flip can still
 * move a glyph box on the next.
 */
export function useConfigFitReadout(ref: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  const [report, setReport] = useState<ConfigFitReport>(EMPTY);

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

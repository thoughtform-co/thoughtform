"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * StageBed — the `#services` stage, stood in for.
 *
 * The dossier's production seat is a child of `.services-stage__items`,
 * over the parked corridor brandmark. This reproduces that box so the
 * window is judged against the real geometry and the real backdrop:
 *
 *   · The element carries `.services-stage` so the dossier's controller
 *     finds it with `closest()` and reads its clock exactly as it will in
 *     production.
 *   · `STAGE_STYLE` parks every envelope. It is a MODULE CONSTANT on
 *     purpose (the `CardFaceFrame` lesson): a fresh object literal each
 *     render makes React re-apply the style attribute and clobber the
 *     imperative `--svc-proof-in` writes the replay does — which is the
 *     one property the controller's MutationObserver watches.
 *   · The backdrop is a still, not a canvas. The window's own
 *     `blur(12px)` erases particle micro-motion anyway, so a live WebGL
 *     mark would cost a canvas, a frameloop and headless flakiness to
 *     look identical. A canvas here would also be the wrong rehearsal:
 *     the shipped surface must keep `three` off the landing DOM path.
 *
 * Layers, back to front: void → gold glow → mark still → orbit arcs. The
 * still is optional — until `scripts/capture-dossier-mark.mjs` has run,
 * the glow alone stands in and nothing errors (the <img> is only rendered
 * when `still` is on).
 */

/** Parked envelopes — the dossier's end-state. Module constant; see above. */
const STAGE_STYLE = {
  "--svc-proof-in": "1",
  "--svc-content-in": "0",
  "--svc-exit": "0",
} as CSSProperties;

export interface StageBedProps {
  /** Mark dim, 0..1 — the lab knob that picks the production constant. */
  markDim: number;
  /** Show the captured mark still behind the glass. */
  still: boolean;
  /** The stage element, so the shell can drive the clock for a replay. */
  stageRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function StageBed({ markDim, still, stageRef, children }: StageBedProps) {
  return (
    <div className="pdl-bed" style={{ ["--pdl-mark-dim" as string]: markDim } as CSSProperties}>
      <i className="pdl-bed__glow" aria-hidden="true" />
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element -- lab-only asset, no layout shift budget to protect
        <img
          className="pdl-bed__still"
          src="/dossier-lab/mark-still.webp"
          alt=""
          aria-hidden="true"
        />
      ) : null}
      {/* Orbit arcs are drawn here rather than baked into the still: they
          flank the window, so they are a composition knob the owner will
          want to nudge, and keeping them out keeps the capture
          deterministic. */}
      <svg
        className="pdl-bed__arcs"
        viewBox="-100 -100 200 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <ellipse className="pdl-bed__arc" cx="0" cy="0" rx="78" ry="30" />
        <ellipse
          className="pdl-bed__arc pdl-bed__arc--dotted"
          cx="0"
          cy="0"
          rx="62"
          ry="62"
          transform="rotate(18)"
        />
        <ellipse className="pdl-bed__arc" cx="0" cy="0" rx="88" ry="52" transform="rotate(-14)" />
      </svg>

      {/* The real stage box — `.services-stage` so `closest()` resolves,
          `.services-stage__items` so the dossier's `inset: 0` host has the
          same full-size relative parent it gets in production. */}
      <div className="services-stage pdl-stage" ref={stageRef} style={STAGE_STYLE}>
        <div className="services-stage__items">{children}</div>
      </div>
    </div>
  );
}

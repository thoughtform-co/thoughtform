import type { ReactNode } from "react";

import {
  DIAL_RINGS,
  DIAL_TRACK,
  DIAL_VB,
  dialCirclePath,
  dialHandover,
  dialSpokes,
  dialStubs,
  dialTicks,
  type DialInk,
  type DialSeg,
} from "./dialLayout";

/**
 * The dial's marks (ADR-106) — line work only, no text.
 *
 * ⚠ EVERY COLOUR IS AN `--arc-dial-*` ALIAS of the ADR-077 ramp, declared on
 * `.arc-dial` in arcs.css. Never a `--dawn-*` or a raw `--gold`: the arc
 * routes do import landing.css, so those tokens resolve — which is exactly
 * what makes the mistake silent, and the light theme is where it surfaces.
 *
 * ⚠ THE STATIC LINE WORK TAKES `vector-effect: non-scaling-stroke` (in CSS) so
 * a hairline is one device pixel at every stage size. The DRAW-ON runs may not:
 * the browser then ignores `pathLength` and the draw breaks into partial arcs
 * (a trap paid for once already on `ServicesOrbitMap`).
 */

const INK: Record<DialInk, string> = {
  line: "var(--arc-dial-line)",
  line2: "var(--arc-dial-line2)",
  tick: "var(--arc-dial-tick)",
  stub: "var(--arc-dial-stub)",
  gold: "var(--arc-dial-gold)",
  "gold-soft": "var(--arc-dial-gold-soft)",
};

function Seg({ s }: { s: DialSeg }) {
  return (
    <line className="arc-dial__hair" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={INK[s.ink]} />
  );
}

/**
 * The register every stage shares: an opaque disc, six rings, the rim's
 * graduation, four cardinal stubs, four radial spokes.
 *
 * ⚠ THE DISC IS LOAD-BEARING, NOT DECORATION. On the Trinny scene this figure
 * sits on the coral wash, which no contrast walk can see — line work with no
 * bed is line work over nothing measurable. It is also what makes the drawing
 * read as a machined dial rather than as rules floating on a ground.
 */
export function Dial({ children }: { children?: ReactNode }) {
  return (
    <svg
      className="arc-dial__svg"
      viewBox={`${DIAL_VB.x} ${DIAL_VB.y} ${DIAL_VB.w} ${DIAL_VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="arc-dial__bed" r={DIAL_RINGS[0].r} fill="var(--arc-dial-bed)" />
      <g className="arc-dial__rings">
        {DIAL_RINGS.map((ring) => (
          <circle
            key={ring.id}
            className="arc-dial__hair"
            r={ring.r}
            stroke={INK[ring.ink]}
            strokeDasharray={ring.dash}
          />
        ))}
      </g>
      <g className="arc-dial__grad">
        {dialTicks().map((s) => (
          <Seg key={s.id} s={s} />
        ))}
        {dialStubs().map((s) => (
          <Seg key={s.id} s={s} />
        ))}
      </g>
      <g className="arc-dial__spokes">
        {dialSpokes().map((s) => (
          <Seg key={s.id} s={s} />
        ))}
      </g>
      {children}
    </svg>
  );
}

/**
 * Stage 2 — THE RUN. One lit run travelling the track the four stations sit
 * on, drawn on by the stage's own clock. The stations themselves are DOM
 * nodes (the callout's proven mechanism); this is the run alone.
 */
export function RunFigure() {
  return (
    <path
      className="arc-dial__run"
      d={dialCirclePath(DIAL_TRACK)}
      pathLength={100}
      stroke="var(--arc-dial-run)"
    />
  );
}

/**
 * Stage 3 — THE ARC THAT ENDS. The setup is the closed inner circle and keeps
 * running; the engagement is a short arc on the outer track that terminates at
 * a capped node, with the track past it left bare.
 *
 * ⚠ THE BARE REMAINDER IS DRAWN, at the faintest rung. An arc that simply
 * stops in empty space reads as a rendering fault; an arc that stops ON a
 * track that continues reads as the deliberate end it is.
 */
export function HandoverFigure() {
  const g = dialHandover();
  return (
    <>
      <path
        className="arc-dial__bare"
        d={g.bare}
        stroke="var(--arc-dial-line2)"
        strokeDasharray="1 3"
      />
      <path
        className="arc-dial__run arc-dial__run--inner"
        d={g.inner}
        pathLength={100}
        stroke="var(--arc-dial-run)"
      />
      <path
        className="arc-dial__run arc-dial__run--outer"
        d={g.outer}
        pathLength={100}
        stroke="var(--arc-dial-engage)"
      />
      <line
        className="arc-dial__cap"
        x1={g.cap.x1}
        y1={g.cap.y1}
        x2={g.cap.x2}
        y2={g.cap.y2}
        stroke={INK[g.cap.ink]}
      />
    </>
  );
}

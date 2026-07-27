import type { ReactNode } from "react";

import { LAB_HIGHLIGHT_EXTRAS as X } from "../proofHighlightLabData";

/**
 * C — ANNOTATED SCHEMATIC. No card; the artefact IS the composition.
 *
 * The Arc sphere sits on the void as a subject under inspection, with elbow
 * leaders and diamond ticks radiating to six phase-tagged callouts — the
 * `ServicesDesignationLayer` cutaway grammar, rebuilt as static lab markup
 * (the production layer is px-anchored to a projected canvas rect and cannot
 * be reused off-canvas).
 *
 * Split by design: LINES live in an SVG on a fixed viewBox, LABELS are HTML
 * positioned by percentage of that same box. Putting the type in the SVG would
 * scale it with the viewport and shrink it out of the band's type ramp; this
 * way lines and subject scale together while the copy keeps its real size —
 * which is exactly how the production designation layer is built.
 */

/** The shared coordinate space. Lines use it directly; labels use percentages
 *  of it, so both stay locked together at every width. */
const VB = { w: 1104, h: 430 };
const CX = VB.w / 2;
const CY = 196;

interface Leader {
  /** Tick point, on the subject's edge. */
  from: [number, number];
  /** Where the leader lands (and the label edge sits). */
  to: [number, number];
  /** Elbow x — omit for a straight horizontal run. */
  bend?: number;
  side: "l" | "r";
}

/**
 * Six leaders on one diagonal pair + a horizontal through the equator.
 *
 * Every `from` sits OUTSIDE the subject's visible radius (~150 at this box):
 * the subject paints above the lines, so a tick placed on the sphere itself is
 * simply swallowed. The leaders should read as emerging from behind it, with
 * their ticks landing in clear space.
 */
const LEADERS: readonly Leader[] = [
  { from: [415, 100], to: [150, 58], bend: 330, side: "l" },
  { from: [384, 196], to: [110, 196], side: "l" },
  { from: [415, 292], to: [150, 334], bend: 330, side: "l" },
  { from: [689, 100], to: [954, 58], bend: 774, side: "r" },
  { from: [720, 196], to: [994, 196], side: "r" },
  { from: [689, 292], to: [954, 334], bend: 774, side: "r" },
];

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

export function DirectionSchematic({ capture }: { capture: ReactNode }) {
  return (
    <section className="phl-sc">
      <div className="phl-sc__plate">
        <span className="phl-sc__grid" aria-hidden="true" />

        {/* The subject. Centred on the same coordinate space the leaders use. */}
        <div
          className="phl-sc__subject"
          style={{ left: pct(CX, VB.w), top: pct(CY, VB.h), width: pct(320, VB.w) }}
        >
          {capture}
        </div>

        <svg
          className="phl-sc__lines"
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {LEADERS.map((l, i) => {
            const d =
              l.bend === undefined
                ? `M${l.from[0]} ${l.from[1]}L${l.to[0]} ${l.to[1]}`
                : `M${l.from[0]} ${l.from[1]}L${l.bend} ${l.to[1]}L${l.to[0]} ${l.to[1]}`;
            return (
              <g key={i}>
                <path className="phl-sc__stroke" d={d} />
                {/* Diamond tick at the subject end — shape law: never a dot. */}
                <rect
                  className="phl-sc__tick"
                  x={l.from[0] - 3}
                  y={l.from[1] - 3}
                  width={6}
                  height={6}
                  transform={`rotate(45 ${l.from[0]} ${l.from[1]})`}
                />
              </g>
            );
          })}
        </svg>

        {/* Callouts — HTML, so the type keeps the band's ramp at every width. */}
        {X.callouts.map((c, i) => {
          const l = LEADERS[i];
          if (!l) return null;
          const style =
            l.side === "l"
              ? { right: pct(VB.w - l.to[0], VB.w), top: pct(l.to[1], VB.h) }
              : { left: pct(l.to[0], VB.w), top: pct(l.to[1], VB.h) };
          return (
            <div className={`phl-sc__call phl-sc__call--${l.side}`} style={style} key={c.label}>
              <span className="phl-sc__tag">{c.tag}</span>
              <span className="phl-sc__v">{c.value}</span>
              <span className="phl-sc__l">{c.label}</span>
            </div>
          );
        })}
      </div>

      <div className="phl-sc__foot">
        <p className="phl-sc__summary">{X.summary}</p>
        <p className="phl-cta">
          {X.cta} <i aria-hidden="true">→</i>
        </p>
      </div>
    </section>
  );
}

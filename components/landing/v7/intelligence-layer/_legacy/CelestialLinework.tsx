"use client";

/**
 * CelestialLinework — hairline orbital enrichment for the Intelligence
 * Layer substrate dock.
 *
 * Vector-first model: the brandmark itself is now rendered as a crisp
 * SVG by `BrandmarkVectorActor` (in `ring` topology during the
 * substrate window), so the cloud no longer paints the substrate's
 * orbital body. This component lives on top of that vector ring and
 * adds the celestial-editor enrichment that makes the I-Layer scene
 * read as a real instrument panel:
 *
 *   - hairline outer guide ring (gold dashed)
 *   - bearing ticks at 30° intervals
 *   - cardinal diamonds at 0/90/180/270°
 *   - stroke-dashoffset draw-in animation gated by `--ilayer-progress`
 *
 * Sized + positioned via its parent `.ilayer__brandmark-anchor`
 * (which is centred at the substrate triad-y, sized from the shared
 * `--ilayer-ring-diameter`). All strokes are hairline gold and all
 * animations are driven by CSS variables — no JS per frame.
 *
 * Renders nothing on mobile (`@media (max-width: 960px)` collapses
 * the anchor to a 1×1 px slot) thanks to the same media-query block
 * in landing.css.
 */

import { CELESTIAL_LINEWORK_CSS_ID } from "./celestial-linework-styles";

/** ViewBox span. We use a [-120, 120] symmetric viewBox so the
 *  brandmark ring (which the vector actor renders inside the same
 *  bounding rect) sits at the centre at radius ~58, and our outer
 *  decoration sits at radius ~110 — leaving a comfortable margin
 *  between the gold C-arc and the celestial chrome. */
const VIEW_HALF = 120;
const VIEWBOX = `-${VIEW_HALF} -${VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`;

/** Outer guide ring radius. Sits OUTSIDE the brandmark ring (which
 *  occupies the centre of the anchor at roughly r ≈ 58 in this
 *  viewBox — preserveAspectRatio="xMidYMid meet" maps the
 *  430.99×436 brandmark viewBox to fit the anchor square). */
const RING_RADIUS = 110;

/** Bearing tick configuration. Inner radius (where the tick starts)
 *  and outer radius (where it ends) sit just outside the guide ring
 *  so the ticks read as cardinal/intercardinal bearings rather than
 *  ring decoration. */
const TICK_INNER_RADIUS = 114;
const TICK_OUTER_RADIUS = 118;

/** Diamond pip size for the cardinal markers. */
const DIAMOND_SIZE = 5;

const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Build tick line endpoints for a given angle (in degrees, 0 = top,
 *  clockwise). Returns [x1, y1, x2, y2] in viewBox units. */
function tickEndpoints(angleDeg: number): [number, number, number, number] {
  const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
  const cx = Math.cos(t);
  const sy = -Math.sin(t); // SVG y points down; viewBox here is symmetric so we negate
  return [
    cx * TICK_INNER_RADIUS,
    sy * TICK_INNER_RADIUS,
    cx * TICK_OUTER_RADIUS,
    sy * TICK_OUTER_RADIUS,
  ];
}

/** Cardinal diamond endpoints — a 4-vertex polygon centred on the
 *  guide ring at the given angle. */
function diamondPoints(angleDeg: number): string {
  const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
  const cx = Math.cos(t) * RING_RADIUS;
  const cy = -Math.sin(t) * RING_RADIUS;
  return [
    `${cx},${cy - DIAMOND_SIZE}`,
    `${cx + DIAMOND_SIZE},${cy}`,
    `${cx},${cy + DIAMOND_SIZE}`,
    `${cx - DIAMOND_SIZE},${cy}`,
  ].join(" ");
}

/** Tick angles — 12 ticks every 30° (every clock position). The
 *  cardinal-aligned ticks (0/90/180/270) are suppressed in render
 *  because the diamond pips occupy those positions. */
const TICK_ANGLES = [30, 60, 120, 150, 210, 240, 300, 330];

/** Cardinal angles — diamonds at the four compass points. */
const CARDINAL_ANGLES = [0, 90, 180, 270];

export function CelestialLinework() {
  return (
    <>
      {/* Inline styles for the dash-offset draw-in. Kept here so the
          component is self-contained — there is no class collision
          with the rest of landing.css. */}
      <style id={CELESTIAL_LINEWORK_CSS_ID}>{`
        .tf-celestial-linework {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          /* Drive every animation off the I-Layer's progress channel.
             At progress 0 nothing is drawn; at progress >= 0.08 the
             enrichment is fully drawn in. We use min() inside a
             nested calc to clamp to [0, 1] — clamp() inside CSS
             custom property substitution has parser quirks in some
             browsers, so we keep this explicit. */
          --tf-cl-progress: min(
            1,
            max(0, calc(var(--ilayer-progress, 0) * 12.5))
          );
          opacity: var(--tf-cl-progress);
          transition: opacity 240ms linear;
        }
        .tf-celestial-linework__ring {
          fill: none;
          stroke: var(--gold, #caa554);
          stroke-opacity: 0.45;
          stroke-width: 0.6;
          stroke-dasharray: 2 6;
          stroke-dashoffset: calc(
            ${RING_CIRCUMFERENCE} * (1 - var(--tf-cl-progress))
          );
          transition: stroke-dashoffset 480ms ease-out;
        }
        .tf-celestial-linework__tick {
          stroke: var(--gold, #caa554);
          stroke-opacity: 0.6;
          stroke-width: 0.8;
          stroke-linecap: round;
          /* Each tick inherits the group-level opacity. Per-tick
             stagger lives in landing.css if we want to add it
             later (e.g. clockwise wipe). */
        }
        .tf-celestial-linework__diamond {
          fill: none;
          stroke: var(--gold, #caa554);
          stroke-opacity: 0.85;
          stroke-width: 1;
          transform-box: fill-box;
          transform-origin: center;
          transform: scale(var(--tf-cl-progress));
          transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 960px) {
          .tf-celestial-linework {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-celestial-linework {
            --tf-cl-progress: 1;
            transition: none;
          }
          .tf-celestial-linework__ring,
          .tf-celestial-linework__diamond {
            transition: none;
          }
        }
      `}</style>
      <svg
        className="tf-celestial-linework"
        viewBox={VIEWBOX}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer guide ring — hairline gold dashed circle that
            "draws in" via stroke-dashoffset as the user scrolls
            into the substrate window. */}
        <circle className="tf-celestial-linework__ring" cx={0} cy={0} r={RING_RADIUS} />

        {/* Bearing ticks at 30° intervals (skipping cardinal angles
            where the diamonds sit). Each tick is a short hairline
            radial that reads as a bearing mark. */}
        <g>
          {TICK_ANGLES.map((angle) => {
            const [x1, y1, x2, y2] = tickEndpoints(angle);
            return (
              <line
                key={`tick-${angle}`}
                className="tf-celestial-linework__tick"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              />
            );
          })}
        </g>

        {/* Cardinal diamonds at 0/90/180/270°. Scale 0 → 1 with the
            substrate window so they appear synchronously with the
            ring draw-in. */}
        <g>
          {CARDINAL_ANGLES.map((angle) => (
            <polygon
              key={`diamond-${angle}`}
              className="tf-celestial-linework__diamond"
              points={diamondPoints(angle)}
            />
          ))}
        </g>
      </svg>
    </>
  );
}

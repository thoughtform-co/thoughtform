import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * RouteDiagram — THE ROUTE BEFORE → THE ROUTE NOW, drawn from data.
 *
 * The spine of the Software-for-Few tools plate (ADR-068). The whole claim of
 * a tool built for a handful of people is that a route a reader can COUNT
 * collapses into one module, so the plate draws the count rather than
 * asserting it in a sentence: n outlined steps, three gathering chevrons, one
 * green terminal box. Nothing here is authored — every box, every gap and the
 * two meta lines come out of `ProjectCase.route`.
 *
 * ── THE THREE MEASUREMENTS THAT SET EVERY NUMBER BELOW ──────────────────
 *
 * 1. THE VIEWBOX IS AUTHORED AT THE RENDERED WIDTH, not at a round number.
 *    The SVG is `width: 100%; height: auto`, so rendered type is
 *    `fontUnits × (renderedWidth / VB_W)` — the viewBox is a UNIT CHOICE and
 *    it silently sets the type size. The owner's mockup authors 776 units
 *    into a ~540px field, which renders its 7.5-unit step labels at 5.2px:
 *    two full steps under the 8.5px chrome floor, and invisible in review
 *    because an SVG label does not report that it is too small.
 *    The field measures 594.5 / 669.9 / 839.3px at 1280×720 / 1440×800 /
 *    1920×1080, less 2 × `--fl-shot-px` of gutter ⇒ 566.5 / 641.9 / 811.3.
 *    `VB_W = 560` therefore renders at 1.012× / 1.147× / 1.449×, so a unit
 *    IS a pixel at the binding viewport and every size below reads directly.
 *
 * 2. HEIGHT IS A FUNCTION OF WIDTH, AND THAT IS THE TRAP. `height: auto`
 *    means the drawing gets TALLER on a WIDER viewport while the field only
 *    grows with HEIGHT — so a tall viewBox starves the capture at 1440×800
 *    (the owner's own screen), not at 1280×720 where one would look for it.
 *    Measured, in that order: `VB_H = 88` left the capture 63px there;
 *    `VB_H = 72` overran the field by 3px; `VB_H = 66` lands the route at
 *    75.6px and the capture at ~86. Every band below is budgeted against
 *    that ceiling — growing one costs another, and the last one to pay is
 *    always the capture.
 *
 * 3. A 12-CHARACTER STEP MUST FIT ITS BOX, AND IT BARELY DOES.
 *    `route.before[]` is contract-bounded at 12 chars; five steps share
 *    `LW`, and PT Mono advances 0.60em + tracking. At `STEP_PX` 8.6 and
 *    `.04em` that is 12 × 8.6 × 0.64 = 66.0 units inside a 74.4-unit box —
 *    4.2 units of shoulder each side. The lever is the NOW module's width,
 *    never the step type: 8.6 units renders at 8.70px, which is 0.2px of
 *    headroom over the floor.
 *
 * ── THE CORNER LAW ──────────────────────────────────────────────────────
 * ⚠ `cham()` CUTS TOP-RIGHT AND BOTTOM-LEFT. The mockup's own helper cuts
 * TL+BR, which is the MIRRORED form ADR-065 reserves for the back of a
 * physically flipped object — the same defect the console frame itself
 * carried and had corrected. Flipping it is not cosmetic: every chamfered
 * object on this surface (the console, the stations, the services card, the
 * arc cards) cuts the house diagonal, and one box cutting the other one is
 * exactly the "not super consistent" the owner could see but not name.
 *
 * ── ARRIVAL ─────────────────────────────────────────────────────────────
 * Click-driven only (ADR-021): the SVG is keyed on `toolId`, so switching
 * tools remounts it and the CSS animations replay from the top. There is no
 * clock, no writer and no wall-clock loop — and every keyframe lands on
 * `transform: none`, because these boxes are laid out against a fixed
 * viewBox and a residual transform is a drift bug rather than a flourish.
 */

/* ── The authoring space ────────────────────────────────────────────────
   Units ≈ CSS pixels at 1280×720 (see measurement 1 above). */
const VB_W = 560;
const VB_H = 66;

/** Caption baseline. ⚠ IT IS 9, NOT 7, AND THE DIFFERENCE IS AN ASCENDER.
 *  Measured: PT Mono's box here is 1.117em tall with a 0.913em ascent, so a
 *  9-unit caption on baseline 7 has its bbox top at −1.22 — OUTSIDE the
 *  viewBox, which is a silent clip on this surface (SVG text does not
 *  report). Baseline 9 puts it at 0.78.
 *  ⚠ THE BAND ABOVE THE BOXES IS 0 … 12 AND `casefile.css` KNOWS THAT
 *  NUMBER — the ≤760h crop pulls exactly `12/560` off the top as a
 *  percentage margin. Move this band and move the crop with it. */
const CAP_BASE = 9;
/** The steps' band. */
const BOX_Y = 18;
const BOX_H = 30;
/** Chamfer depth on every box in the drawing — the PLATE rung, scaled to a
 *  30-unit box. */
const CH = 7;
/** The before-steps' echo outline, offset down-right behind each box. */
const ECHO = 4;
/** Gap between steps. Tight on purpose: they are a CHAIN, and the reader is
 *  meant to count links, not read five separate boxes. */
const STEP_GAP = 5;
/** Where the before-region ends. Its last echo lands at `LW + ECHO`. */
const LW = 392;
/** The gathering chevrons. Three, ramping in opacity toward the module. */
const CHEV_X = 400;
const CHEV_PITCH = 12;
const CHEV_ARM = 6;
/** The NOW module. Right-aligned with room for its outermost echo. */
const NOW_W = 100;
const NOW_X = VB_W - 12 - NOW_W;
/** Echo offsets, outward. Bounded by BOTH text bands: at offset 6 the
 *  outermost outline spans y 12 … 54, sitting exactly on the caption band's
 *  floor and exactly on the meta band's ceiling. */
const NOW_ECHOES = [6, 4, 2] as const;
/** Meta baseline. Its box runs 55.15 … 64.75 against a 66-unit viewBox —
 *  1.25 units of margin, on the same ascender arithmetic as `CAP_BASE`.
 *  ⚠ ITS BAND IS 54 … 66 AND `casefile.css` KNOWS THAT NUMBER TOO — the
 *  ≤760h crop pulls `12/560` off the bottom. */
const META_BASE = 63;

/* Type, in units. See measurement 3 for why `STEP_PX` cannot move. */
const CAP_PX = 9;
const STEP_PX = 8.6;
const NOW_PX = 11;
/** ⚠ THE META LINE IS THE ONE THAT CAN SILENTLY VANISH. Both strings are
 *  contract-bounded at 44 chars and they share ONE line from opposite walls:
 *  88 chars at 8.6 units and `.12em` is 545 of the 560 available. Today's
 *  longest pair (35 + 40) uses 464 and leaves 96 units of gap. An SVG label
 *  past the crop does not wrap, ellipsise or report — it just disappears —
 *  so the smoke measures every glyph box against the viewBox. */
const META_PX = 8.6;

/**
 * A chamfered box on the HOUSE diagonal — TOP-RIGHT and BOTTOM-LEFT (ADR-065).
 *
 * Read it as a path: square TL, run to the top-right shoulder, cut down to
 * the right wall, square BR, run back to the bottom-left shoulder, cut up to
 * the left wall, close.
 */
function cham(x: number, y: number, w: number, h: number, c: number): string {
  const r = (n: number) => Number(n.toFixed(2));
  return [
    `M${r(x)},${r(y)}`,
    `H${r(x + w - c)}`,
    `L${r(x + w)},${r(y + c)}`,
    `V${r(y + h)}`,
    `H${r(x + c)}`,
    `L${r(x)},${r(y + h - c)}`,
    "Z",
  ].join(" ");
}

interface RouteDiagramProps {
  route: ProjectCase["route"];
  /** Remount key — switching tools replays the entrance (ADR-021: the clock
   *  is a click, never a timer). */
  toolId: string;
}

export function RouteDiagram({ route, toolId }: RouteDiagramProps) {
  const n = route.before.length;
  const stepW = (LW - (n - 1) * STEP_GAP) / n;
  const midY = BOX_Y + BOX_H / 2;

  return (
    <div className="fl-route">
      <svg
        key={toolId}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label={`The route before: ${route.before.join(", ")} — ${route.beforeMeta}. The route now: ${route.now} — ${route.nowMeta}.`}
      >
        {/* The two captions. Static: they are the frame the drawing arrives
            into, not part of the arrival. */}
        <g className="rt-cap">
          <text x="0" y={CAP_BASE} fontSize={CAP_PX} className="rt-t-cap">
            THE ROUTE BEFORE
          </text>
          <text
            x={VB_W}
            y={CAP_BASE}
            fontSize={CAP_PX}
            textAnchor="end"
            className="rt-t-cap rt-t-own"
          >
            THE ROUTE NOW
          </text>
        </g>

        {/* The steps. OUTLINED, never filled: the before-state is a route
            the reader is counting, not a set of objects. The echo behind
            each one is the mockup's double stroke — it reads as carbon copy
            after carbon copy, which is what a five-source manual route is. */}
        {route.before.map((label, i) => {
          const x = i * (stepW + STEP_GAP);
          return (
            <g className="rt-pop" style={{ animationDelay: `${110 + i * 55}ms` }} key={label + i}>
              <path d={cham(x + ECHO, BOX_Y + ECHO, stepW, BOX_H, CH)} className="rt-echo" />
              <path d={cham(x, BOX_Y, stepW, BOX_H, CH)} className="rt-box" />
              <text
                x={x + stepW / 2}
                y={midY + STEP_PX * 0.35}
                fontSize={STEP_PX}
                textAnchor="middle"
                className="rt-t-step"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Three gathering chevrons, ramping toward the module. */}
        {[0, 1, 2].map((i) => {
          const x = CHEV_X + i * CHEV_PITCH;
          return (
            <path
              key={i}
              className="rt-pop rt-chev"
              style={{ animationDelay: `${450 + i * 70}ms` }}
              d={`M${x},${midY - CHEV_ARM} L${x + CHEV_ARM},${midY} L${x},${midY + CHEV_ARM}`}
              opacity={0.35 + i * 0.3}
            />
          );
        })}

        {/* The NOW module. Green is PROVENANCE on this surface — it says
            Loop's own, which is the entire point of a tool built for four
            people. The three echoes read as the collapsed steps stacked
            behind the one that survived. */}
        <g className="rt-seat">
          {NOW_ECHOES.map((o, i) => (
            <path
              key={o}
              d={cham(NOW_X - o, BOX_Y - o, NOW_W + o * 2, BOX_H + o * 2, CH + o)}
              className="rt-now-echo"
              opacity={0.18 + i * 0.2}
            />
          ))}
          <path d={cham(NOW_X, BOX_Y, NOW_W, BOX_H, CH)} className="rt-now" />
          <text
            x={NOW_X + NOW_W / 2}
            y={midY + NOW_PX * 0.35}
            fontSize={NOW_PX}
            textAnchor="middle"
            className="rt-t-now"
          >
            {route.now}
          </text>
        </g>

        {/* What the old route cost, and what the new one buys. */}
        <g className="rt-meta rt-pop" style={{ animationDelay: "680ms" }}>
          <text x="0" y={META_BASE} fontSize={META_PX} className="rt-t-meta">
            {route.beforeMeta}
          </text>
          <text
            x={VB_W}
            y={META_BASE}
            fontSize={META_PX}
            textAnchor="end"
            className="rt-t-meta rt-t-meta2"
          >
            {route.nowMeta}
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * The sheet's FRAMES — the four enclosures, and the panel anatomy they compose
 * into.
 */

/* ── The frames ───────────────────────────────────────────────────────────
 * Four enclosures, one grammar each, per the corner law (ADR-065):
 *
 *   rule      a 1px box. Says nothing but "these things go together".
 *   housing   CHAMFER, TR + BL, 26px — a machined device you look at. Drawn as
 *             a CLIPPED RING, because a `clip-path` CUTS a border and never
 *             strokes one: a chamfered box with `border: 1px` has no line on
 *             either diagonal. Outer contour clockwise, inner counter-clockwise
 *             1px in, non-zero winding making the middle a hole.
 *             ⚠ The inner chamfer leg is NOT `ch − 1px`: a 45° cut offset
 *             inward by d moves its diagonal by d·√2, so the correction is
 *             −0.6px (the services plate's own).
 *   bay       BRACKETS — framed and observed, but not itself a device.
 *   cell      a square child. The children of a chamfered box are square, which
 *             is what stops the surface reading flat.
 */
export function Frames() {
  return (
    <div className="ik-frames">
      <figure className="ik-frames__cell">
        <div className="ik-frame" data-kind="rule" />
        <figcaption>rule · 1px, no grammar claimed</figcaption>
      </figure>

      <figure className="ik-frames__cell">
        <div className="ik-frame" data-kind="housing">
          <i className="ik-frame__bd" aria-hidden="true" />
        </div>
        <figcaption>housing · chamfer TR + BL, 26px, a clipped ring</figcaption>
      </figure>

      <figure className="ik-frames__cell">
        <div className="ik-frame" data-kind="bay">
          <i data-c="tl" aria-hidden="true" />
          <i data-c="tr" aria-hidden="true" />
          <i data-c="bl" aria-hidden="true" />
          <i data-c="br" aria-hidden="true" />
        </div>
        <figcaption>bay · brackets, framed but not a device</figcaption>
      </figure>

      <figure className="ik-frames__cell">
        <div className="ik-frame" data-kind="cell">
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </div>
        <figcaption>cell · square children, seams not gutters</figcaption>
      </figure>
    </div>
  );
}

/* ── The panel anatomy ────────────────────────────────────────────────────
 * What both references share and this surface half-has: a BAR the instrument
 * hangs from, its selector INSIDE that bar, a body, and a foot note that says
 * one thing.
 *
 * Measured on Tensorlake: the bar is 48–63px and one rung lighter than the body
 * it heads; the tabs live in it; the foot is a diamond and a single sentence.
 * On the casefile the head is a RULE with the client's name on it (ADR-089 U1
 * deleted its `state`), the stations are in the field's own rail on the other
 * side of the column split, and the foot is a verdict band on some rows only.
 *
 * The diagram labels each part with the production class that draws it, so a
 * ruling here can be traced to a selector rather than to a picture.
 */
const PARTS = [
  { k: "head", cls: ".fl-hz__head", note: "a rule; the name is underlined into it" },
  { k: "identity", cls: ".fl-tabs", note: "the client, seated on the head's own line" },
  { k: "record", cls: ".fl-left", note: "brief · proof register · directory, one grid" },
  { k: "split", cls: ".fl-split", note: "the column seam, and every horizontal ends on it" },
  { k: "rail", cls: ".fl-con__rail", note: "the field's own header — stations, not tabs" },
  { k: "field", cls: ".fl-con__field", note: "one instrument that changes what it displays" },
  { k: "foot", cls: ".fl-verdict", note: "one sentence, on the sheets rows only" },
];

export function PanelAnatomy() {
  return (
    <div className="ik-anatomy">
      <div className="ik-anatomy__fig" aria-hidden="true">
        <i data-part="head" />
        <i data-part="identity" />
        <i data-part="record" />
        <i data-part="split" />
        <i data-part="rail" />
        <i data-part="field" />
        <i data-part="foot" />
      </div>
      <dl className="ik-anatomy__key">
        {PARTS.map((p) => (
          <div className="ik-anatomy__row" key={p.k}>
            <dt>{p.k}</dt>
            <dd>
              <code>{p.cls}</code>
              <span>{p.note}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * VesperSessionWireframe — the image & video suite's session view, DRAWN.
 *
 * The bay's first AUTHORED wireframe (ADR-068 Decision 5), recomposed by
 * ADR-068 U5 (owner, 2026-08-09) around THREE components and nothing else —
 * the prompt, the generated image, and the composer that makes it — and
 * re-seated by U6 (same day): the three centre as ONE composition, the
 * prompt bar in flow right under the row rather than pinned to the floor
 * of an uncapped bay.
 *
 *   ┌ chrome ───────────────────────────────────────────────────────┐
 *   │ ▬ ▭                                                           │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ ⊞ │                                                           │
 *   │ ▫ │ ┌ PROMPT ──────┐  ┌──────────┐                            │
 *   │ ▫ │ │ ▬▬▬▬  ▬▬     │  │   ◠ ▨    │   ← the generation row     │
 *   │ ▫ │ │ ▬▬▬   ·· ▬   │  │ (image)  │                            │
 *   │   │ └──────────────┘  └──────────┘                            │
 *   │   │ [▭ input......] [✦ ENHANCE PROMPT] [GENERATE]             │
 *   │   │                                                           │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * ── WHAT THE BOX IS, AND WHY EVERY NUMBER BELOW IS A PERCENTAGE ─────────
 *
 * `.fl-shot__frame` is the flex-SACRIFICIAL element of the tools plate: it
 * takes the height everything else leaves (246.5 → 739px tall across the
 * reference viewports since the U4 no-ceiling pass). So:
 *
 * 1. THE DRAWING IS DOM, NOT AN SVG VIEWBOX. A viewBox has ONE aspect and
 *    would letterbox or crop across that spread, and ADR-064's bleed law
 *    forbids a letterbox in this frame. Divs reflow; a viewBox does not.
 *    Only the MARKS (the new-session plus, the enhancer wand, the image
 *    glyph) are inline SVG, because each is a shape rather than a box.
 * 2. `.fl-wire__in` IS A SIZE CONTAINER, so every span below is `cqw`/`cqh`
 *    of the BAY and the whole drawing scales with it. ⚠ `.fl-con` is only
 *    an `inline-size` container, so `cqh` there would silently fall back
 *    to the viewport; the size container here is what makes the vertical
 *    rhythm mean anything.
 * 3. The session rail is deliberately THIN — the drawing keeps the app's
 *    ORDER and adjacency, never its window ratios (ADR-068 D5 lesson b).
 *
 * ── THE ONE OBSTACLE IN THE BOX ─────────────────────────────────────────
 * The halftone veil paints OVER this drawing — except the gold CTA, which
 * rides above it at z 1 (U5 punch-through: the redrawn tools carry the
 * veil on `.fl-wire__in::after`; the frame's own veil stands down).
 *
 * ── THE RULES THIS DRAWING KEEPS (D5 as amended by U5/U6) ───────────────
 * · NO FILTER, NO `<img>`. ADR-064 U2's line is AUTHORED vs CAPTURED and a
 *   wireframe is authored evidence.
 * · THREE LETTERED ELEMENTS AND THAT IS THIS DRAWING'S SET (`PROMPT`,
 *   `ENHANCE PROMPT`, `GENERATE`) — the smoke pins every text-bearing
 *   element by sorted-array equality. PT Mono ≥8.6px, NO DIGITS anywhere.
 *   The U3 draw meter, nav lozenge, PRODUCT LIBRARY row, MODEL row and
 *   mode bar are DELETED (owner: cut the clutter; D5's meter-never-a-
 *   figure clause is dormant with the meter — the digit ban survives it).
 * · TWO SIGNAL COLOURS (U5): the ENHANCE PROMPT plate is green — the
 *   operational flow, the tool's own `genai-prompting` rewrite — and
 *   exactly ONE solid gold plate, GENERATE. The enhance plate is
 *   SQUARE-CORNERED since U6 (the clipped border read as missing
 *   corners; the one cut object in the row is the CTA). The image glyph
 *   keeps the gold mark: the made thing.
 * · STATIC. No keyframes of its own (ADR-021); the bay's entrance is the
 *   only motion this box has ever had.
 * · `aria-hidden`. The frame is the button and its label is the action; the
 *   drawing is decoration under a control, not a second description.
 */
export function VesperSessionWireframe() {
  return (
    /* ⚠ THE ROOT CARRIES THE TOOL MODIFIER (2026-08-08, four-wireframe
       pass). Every vesper element rule in casefile.css is scoped
       `.fl-wire--vesper .fl-wire__…`, because names like `__card`/`__say`
       are generic-sounding but vesper-specific in their values — an
       unscoped rule is a trap for the next tool's drawing. Only
       `.fl-wire`, `.fl-wire__in`, `.fl-wire__lbl` and the U5 grammar pair
       are shared. */
    <div className="fl-wire fl-wire--vesper" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── 1 · TOP CHROME — the title cluster alone (U5) ── */}
        <div className="fl-wire__chrome">
          <span className="fl-wire__ttl">
            <i className="fl-wire__ttl-bar" />
            <i className="fl-wire__ttl-pill" />
          </span>
        </div>

        {/* ── 2 · THE SESSION RAIL AND THE CENTRED COMPOSITION ── */}
        <div className="fl-wire__body">
          <div className="fl-wire__rail">
            <i className="fl-wire__new">
              <svg viewBox="0 0 12 12">
                <path d="M6,3.4 V8.6 M3.4,6 H8.6" />
              </svg>
            </i>
            <i className="fl-wire__sess" data-on="" />
            <i className="fl-wire__sess" />
            <i className="fl-wire__sess" />
          </div>

          {/* The card, the image and the composer centre as ONE group
              (U6, owner: "the prompt bar should be higher… aligned
              vertically centered"). */}
          <div className="fl-wire__main">
            <div className="fl-wire__gal">
              {/* The prompt card — what was asked for, beside what came
                  back. The label LEADS (ADR-068 lesson a); bars of unequal
                  length are the request, the meta row its marks. */}
              <div className="fl-wire__card">
                <span className="fl-wire__lines">
                  <span className="fl-wire__lbl">PROMPT</span>
                  <i />
                  <i />
                  <i />
                  <span className="fl-wire__meta">
                    <b className="fl-wire__dot" />
                    <b className="fl-wire__dot" />
                    <b className="fl-wire__mb" />
                    <b className="fl-wire__mb" />
                  </span>
                </span>
              </div>

              {/* The generated image — the horizon-and-sun mark in the
                  gold signal, on the gold-tinged GENERATED ground. */}
              <span className="fl-wire__tile">
                <svg
                  className="fl-wire__tileglyph"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <circle cx="15.5" cy="8" r="2.6" />
                  <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
                </svg>
              </span>
            </div>

            {/* ── 3 · THE COMPOSER — one row, the whole loop, in flow
                right under the generation row (U6). Input → the green
                ENHANCE PROMPT (the tool's own prompt rewrite) → the gold
                GENERATE. */}
            <div className="fl-wire__dock">
              <div className="fl-wire__comp">
                <i className="fl-wire__say">
                  <b />
                </i>
                <span className="fl-wire__enh">
                  <svg className="fl-wire__wand" viewBox="0 0 12 12">
                    <path d="M6,0 L7.15,4.85 L12,6 L7.15,7.15 L6,12 L4.85,7.15 L0,6 L4.85,4.85 Z" />
                  </svg>
                  <span className="fl-wire__lbl fl-wire__lbl--grn">ENHANCE PROMPT</span>
                </span>
                <span className="fl-wire__cta">
                  <span className="fl-wire__lbl">GENERATE</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

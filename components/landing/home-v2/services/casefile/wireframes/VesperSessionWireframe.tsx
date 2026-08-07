/**
 * VesperSessionWireframe — the image & video suite's session view, DRAWN.
 *
 * The bay's first AUTHORED wireframe (ADR-068 Decision 5). It replaces the
 * duotoned screenshot for this one tool: a capture of a generation canvas is
 * the walkthrough's FACE, and what the plate is arguing is that the canvas
 * has a SHAPE — one session rail, one generation row, one composer that
 * carries the whole loop. A drawing can say that at 86px tall; a screenshot
 * cannot.
 *
 *   ┌ chrome ───────────────────────────────────────────────────────┐
 *   │ ▬ ▭            ( ··· )                    [▓▓░░░░] DRAW       │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ ⊞ │ ┌ prompt ─────┐  ┌──┐ ┌──┐                                │
 *   │ ▫ │ │ ▬▬▬▬  ▬▬    │  │  ⋮│ │▭ │   ← the generation row        │
 *   │ ▫ │ │ ▬▬▬   ·· ▬  │  └──┘ └──┘                                │
 *   │ ▫ │ └─────────────┘                                           │
 *   │        ┌ composer ────────────────────────────────┐ ┌─┐       │
 *   │        │ ▫ ▫ ⊹  PRODUCT LIBRARY                   │ │▨│       │
 *   │        │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▓▒▓▒▓ ✦ ENHANCE         │ │ │       │
 *   │        │ [MODEL] ◇ ▭                    [GENERATE]│ │ │       │
 *   │        └──────────────────────────────────────────┘ └─┘       │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * ── WHAT THE BOX IS, AND WHY EVERY NUMBER BELOW IS A PERCENTAGE ─────────
 *
 * `.fl-shot__frame` is the flex-SACRIFICIAL element of the tools plate: it
 * takes the height the header, route, bay chrome, detail grid and foot
 * leave. Measured (commit 4) at 1280×720 / 1440×800 / 1920×1080 it is
 * **564.5×105.3 · 639.9×86.4 · 809.3×205.7** — a wide, SHORT strip, ~7.4:1
 * at the binding viewport. So:
 *
 * 1. THE DRAWING IS DOM, NOT AN SVG VIEWBOX. A viewBox has ONE aspect and
 *    would letterbox or crop across a 5.4:1 → 2.5:1 spread, and ADR-064's
 *    bleed law forbids a letterbox in this frame. Divs reflow; a viewBox
 *    does not. Only the four MARKS (the new-session plus, the enhancer
 *    wand, the model diamond, the GENERATE plate) are inline SVG, because
 *    each is a shape rather than a box.
 * 2. `.fl-wire__in` IS A SIZE CONTAINER, so every span below is `cqw`/`cqh`
 *    of the BAY and the whole drawing scales with it — one set of numbers
 *    for three viewports and the unwrapped column. ⚠ `.fl-con` is only an
 *    `inline-size` container, so `cqh` there would silently fall back to
 *    the viewport; the size container here is what makes the vertical
 *    rhythm mean anything.
 * 3. THREE BANDS AND NO MORE at 86px — chrome, gallery, composer. The
 *    session rail and the mode bar are deliberately THIN (a literal 7% rail
 *    is 45px of empty column in a box this wide); the drawing keeps the
 *    app's ORDER and adjacency, not its ratios.
 *
 * ── THE TWO OBSTACLES IN THE BOX ────────────────────────────────────────
 * The halftone veil (`.fl-shot__frame::after`) and the RUN plate (`.fl-run`,
 * z 2, ~98×40 dead centre) are siblings that paint OVER this drawing — it
 * carries no z-index and sits under both by tree order. So nothing
 * load-bearing is centred: the composer's own content lives at its LEFT and
 * RIGHT ends and only bar-work crosses the middle.
 *
 * ── THE ONE DELIBERATE DIVERGENCE FROM THE REAL UI ──────────────────────
 * ⚠ THE DRAW READOUT IS A METER, NEVER A FIGURE. The tool prints USD; this
 * page may not — the map's `Never a price.` line, the casefile's
 * confidentiality envelope (rules/proof.md). A partial gold fill says the
 * same thing the app's readout says (a run costs something, and you can see
 * it) without publishing a number. Recorded in ADR-068 D5.
 *
 * ── THE RULES THIS DRAWING KEEPS ────────────────────────────────────────
 * · NO FILTER, NO `<img>`. ADR-064 U2's line is AUTHORED vs CAPTURED and a
 *   wireframe is authored evidence; the duotone is the recipe for arbitrary
 *   screenshot colour, and there is none here to normalize.
 * · FOUR MICRO-LABELS, AND THAT IS THE BUDGET (`DRAW`, `PRODUCT LIBRARY`,
 *   `ENHANCE`, `MODEL`). PT Mono via `--fl-mono`, floored at 8.6px so the
 *   binding 86px box still clears the 8.5px chrome floor. Everything else
 *   is unlabelled geometry — a wireframe that letters its own parts is a
 *   diagram, and a diagram competes with the plate's route for the same
 *   reading.
 * · GOLD IS THE ONLY SIGNAL COLOUR — the draw fill, the active session
 *   mark, the enhancer wand, the GENERATE plate, the lit mode cell. GREEN
 *   IS NOT USED: green is PROVENANCE on this surface ("Loop's own") and
 *   nothing in this drawing is ours — it is the tool's own interface.
 * · STATIC. No keyframes of its own (ADR-021); the bay's entrance is the
 *   only motion this box has ever had.
 * · `aria-hidden`. The frame is the button and its label is the action; the
 *   drawing is decoration under a control, not a second description.
 */
export function VesperSessionWireframe() {
  return (
    <div className="fl-wire" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── 1 · TOP CHROME ────────────────────────────────────────────
            Title bar left, the collapsed nav lozenge centred, the draw
            readout right. The readout is the only gold in this band. */}
        <div className="fl-wire__chrome">
          <span className="fl-wire__ttl">
            <i className="fl-wire__ttl-bar" />
            <i className="fl-wire__ttl-pill" />
          </span>

          <span className="fl-wire__nav">
            <i />
            <i />
            <i />
          </span>

          <span className="fl-wire__draw">
            <i className="fl-wire__meter">
              <b />
            </i>
            <span className="fl-wire__lbl">DRAW</span>
          </span>
        </div>

        {/* ── 2 + 3 · THE SESSION RAIL AND THE GENERATION ROW ───────────
            The rail spans the full band (it clears the composer, which is
            inset 16% each side), while the gallery is padded off the
            composer's ceiling so the three bands read as three. */}
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

          <div className="fl-wire__gal">
            {/* The prompt card — what was asked for, beside what came
                back. Bars of unequal length are the request; the meta row
                is its two marks and its settings; the square is the
                reference image it was given. */}
            <div className="fl-wire__card">
              <span className="fl-wire__lines">
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
              <i className="fl-wire__cardref" />
            </div>

            {/* The outputs. A faint gold-tinged ground says GENERATED
                without drawing an image — a wireframe that renders
                imagery is a mockup, and a mockup of someone else's
                pictures is a screenshot again. */}
            <span className="fl-wire__tile">
              <b className="fl-wire__acts">
                <i />
                <i />
                <i />
              </b>
            </span>
            <span className="fl-wire__tile">
              <b className="fl-wire__clip" />
            </span>
          </div>
        </div>

        {/* ── 4 + 5 · THE FLOATING COMPOSER AND THE MODE BAR ────────────
            Bottom-centre and deliberately NOT full-bleed: the composer
            floats over the gallery in the real app, and the inset is what
            says so. It overlaps the band above it by 3cqh — enough to
            read as floating, not enough to eat the row. */}
        <div className="fl-wire__dock">
          <div className="fl-wire__comp">
            {/* ⚠ THE LABEL LEADS, AND THAT IS THE RUN PLATE'S DOING. Drawn
                after the squares it ran 27px UNDER the RUN key at 1280×720
                — measured — because the key is centred on the FRAME while
                the composer is inset 16% each side, so the row's content
                reaches the middle before the plate ends. Leading, it clears
                the key at every reference viewport and at the unwrapped
                column, and label-then-items is this surface's own grammar
                anyway. */}
            <span className="fl-wire__row">
              <span className="fl-wire__lbl">PRODUCT LIBRARY</span>
              <i className="fl-wire__thumb" />
              <i className="fl-wire__thumb" />
              <i className="fl-wire__thumb fl-wire__thumb--add" />
            </span>

            {/* The prompt bar, with the enhancer's glitch-morph
                abstracted: the tail of the line breaks into offset
                blocks under the wand. */}
            <span className="fl-wire__row">
              <i className="fl-wire__say" />
              <i className="fl-wire__scram">
                <b />
                <b />
                <b />
                <b />
                <b />
              </i>
              <svg className="fl-wire__wand" viewBox="0 0 12 12">
                <path d="M6,0 L7.15,4.85 L12,6 L7.15,7.15 L6,12 L4.85,7.15 L0,6 L4.85,4.85 Z" />
              </svg>
              <span className="fl-wire__lbl">ENHANCE</span>
            </span>

            {/* ⚠ THE GENERATE PLATE CUTS TOP-RIGHT AND BOTTOM-LEFT —
                the house diagonal (ADR-065). Every chamfered object on
                this surface cuts the same way; one box cutting the other
                is the inconsistency a reader can see and not name. */}
            <span className="fl-wire__row">
              <span className="fl-wire__lbl fl-wire__chip">MODEL</span>
              <svg className="fl-wire__dia" viewBox="0 0 12 12">
                <path d="M6,0.9 L11.1,6 L6,11.1 L0.9,6 Z" />
              </svg>
              <i className="fl-wire__ratio" />
              <svg className="fl-wire__gen" viewBox="0 0 68 14" preserveAspectRatio="none">
                <path d="M0,0 H62 L68,6 V14 H6 L0,8 Z" />
              </svg>
            </span>
          </div>

          <div className="fl-wire__modes">
            <i data-on="" />
            <i />
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}

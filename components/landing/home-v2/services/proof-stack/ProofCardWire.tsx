/**
 * ProofCardWire — the proof card's own layout, drawn (ADR-104).
 *
 * Owner, 2026-09-15: _"I would like it to first show a wireframe of all the
 * elements when it slides open, kind of like what we have with the software
 * for few. We build the tools and the wireframes needed for the layout of
 * the card. Once it's fully open, all the content is actually revealed,
 * because the slide-in opening with the thumbnail of the ATL doesn't really
 * work."_
 *
 * So card 0's aperture (ADR-097 U12) reveals this, the card holds it for a
 * beat, and a second sweep of the same scan fills it with the real content.
 * The card reads as an instrument assembling rather than as a picture
 * arriving.
 *
 * ⚠ **IT IS THE CARD'S OWN LAYOUT, NOT A DRAWING OF A CARD.** Every box here
 * mirrors a real one — `.pf-card__body`'s `2fr 3fr` grid, the record's
 * `auto auto 1fr` rows and its `--pf-card-py` / `--pf-card-px` padding, the
 * register's `minmax(0, 1fr)` bands and their two rule weights, the field's
 * `--pf-field-px` inset and `--pf-frame-gap` air, the rail's
 * `--pf-rail-hang` + `--pf-rail-h` row, the frame's 1px border. That
 * registration is the whole effect: the content has to look like it FILLED
 * the wireframe, not like a second picture replaced it. A bar that is not
 * where its line of type will be turns the handoff into a cut.
 *
 * ⚠ **IT IS DRAWN IN THE CARD'S OWN TOKENS, NOT IN `--w-*`.** The casefile's
 * wireframe kit (`casefile.css`'s `.fl-wire__in` block) is the grammar the
 * owner named, and its values are `rgba(dawn, .15)` hairlines over
 * `rgba(dawn, .13)` fills — within a hair of this card's own `--pf-rule`
 * (.18) and `--pf-rule-soft` (.12). Using the CARD's tokens gets the same
 * look AND makes the handoff seamless, because the lines that survive into
 * the filled card — the frame, the rail boxes, the register's rules — are
 * then literally the same colour they were in the skeleton. Shelling in
 * `.fl-wire` would also have imported `container-type: size` and a flex
 * column that this drawing immediately overrides.
 *
 * ⚠ **IT LETTERS NOTHING.** Bars, boxes and hairlines only. `--fl-mono`
 * resolves only inside `.fl-case` / `.arc-*` and this card is neither, so a
 * label here would inherit a third face (ADR-067's standing trap); and a
 * drawing with no strings is outside the confidentiality scanner by
 * construction.
 *
 * ⚠ **IT RENDERS TWICE, AND THAT IS ARITHMETIC.** At fill progress `t` the
 * real content occupies `[50 − 50t, 50 + 50t]` and the wireframe must occupy
 * the two OUTER bands — a disjoint shape one `clip-path` polygon cannot
 * describe. So each half is its own copy of the drawing, clipped with an
 * `inset()` that retracts to its own wall. The duplication is a rendering
 * technique, not a content fact, which is why it lives in here rather than
 * at the call site.
 *
 * ⚠ **NO `data-m` ANYWHERE.** `useRevealMotion` collects its targets once at
 * LandingPage mount; a nested root's nodes are never observed, so a `data-m`
 * here would rest at opacity 0 forever with nothing to say so. The whole
 * drawing is driven by `data-pf-arrive` in CSS.
 *
 * Authored against card 0, which is `atl-films` — a two-station rail over a
 * 4:5 film plate (`proofOrder.ts`; `trinny-proof-order.test.ts` pins that
 * kind, so a re-order fails loudly rather than leaving a skeleton describing
 * a card that is no longer there).
 */
function WireDrawing() {
  return (
    <div className="pf-cardwire__in">
      {/* The record column — title, lede, four ruled claim bands. */}
      {/* ⚠ A BAR IS A LINE, AND ITS ROW IS THAT LINE'S BOX. The counts are
          card 0's own — the title wraps to two display lines and the lede
          sets four — and the rows are `font-size × line-height` off the same
          two tokens the real type uses. Drawn as single bars instead, the
          register landed 111px high and the whole left column read as a
          different card (measured: claims at y232 against the real y343). */}
      <div className="pf-cardwire__record">
        <span className="pf-cardwire__title">
          <span className="pf-cardwire__bar" />
          <span className="pf-cardwire__bar pf-cardwire__bar--mid" />
        </span>
        <span className="pf-cardwire__lede">
          <span className="pf-cardwire__bar" />
          <span className="pf-cardwire__bar" />
          <span className="pf-cardwire__bar" />
          <span className="pf-cardwire__bar pf-cardwire__bar--mid" />
        </span>
        <div className="pf-cardwire__claims">
          {[0, 1, 2, 3].map((i) => (
            <div className="pf-cardwire__claim" key={i}>
              {/* The glyph's box, at `--pf-glyph` — the register's own column. */}
              <span className="pf-cardwire__mark" />
              <span className="pf-cardwire__claim-body">
                <span className="pf-cardwire__bar pf-cardwire__bar--claim" />
                <span className="pf-cardwire__bar pf-cardwire__bar--mid" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The field — the terminal's two regions: the detached rail, and the
          closed evidence frame (ADR-097 U10). The films card has no foot, so
          the frame ends on the record's last rule and nothing is drawn under
          it. */}
      <div className="pf-cardwire__field">
        <div className="pf-cardwire__tabs">
          <span className="pf-cardwire__stn" />
          <span className="pf-cardwire__stn" />
        </div>
        {/* ⚠ BAY THEN FRAME, TWO ELEMENTS, BECAUSE PRODUCTION IS TWO. The bay
            is the size container and carries no padding; the frame is
            `inset: 0` inside it and carries the border and the pad. Collapsed
            into one box the `100cqh` the film's width is solved from would
            include the padding it is supposed to subtract. */}
        <div className="pf-cardwire__bay">
          <div className="pf-cardwire__frame">
            <div className="pf-cardwire__film">
              <span className="pf-cardwire__plate">
                <span className="pf-cardwire__cue" />
              </span>
              {/* Two lines, like the real caption — and the film is CENTRED
                  in its frame, so the caption's height is what seats the
                  plate. A one-line stand-in put the plate 14px low. */}
              <span className="pf-cardwire__cap">
                <span className="pf-cardwire__bar" />
                <span className="pf-cardwire__bar pf-cardwire__bar--mid" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProofCardWire() {
  return (
    <>
      <div className="pf-cardwire pf-cardwire--l" aria-hidden="true">
        <WireDrawing />
      </div>
      <div className="pf-cardwire pf-cardwire--r" aria-hidden="true">
        <WireDrawing />
      </div>
    </>
  );
}

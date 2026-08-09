/**
 * BabylonDubbingWireframe — the UGC Dubber's job screen, drawn (ADR-068 U5;
 * refined U6, owner 2026-08-09: "the flow should be more prominent. The
 * Send to Frontify button should be at the end of this chain; change the
 * copy to just UPLOAD. Let's also use actual original translation").
 *
 *   ┌ ✓TRANSCRIBE ── ✓TRANSLATE ── ✓DUB ── ✓APPROVE ── [UPLOAD] ┐  chrome
 *   │ ORIGINAL                TRANSLATION       │ ▭ tabs     │
 *   │ ▏here's what you need…  これをチェックして…  │ ┌────────┐ │
 *   │ ▏Loop Quiet for focus,  集中にはLoop Quiet │ │        │ │
 *   │ ▏They are reusable      Loopは再利用可能    │ │   ▶    │ │
 *   │ ▏so you can find your…  完璧なフィットを…   │ │  ▬▬▬   │ │
 *   └────────────────────────────────────────────┴─┴────────┴─┘
 *
 * THE ARCHETYPE: the PIPELINE is the picture — four green lettered steps,
 * larger than the surface's micro-chrome (the one deliberate size
 * exception, U6: the flow IS the feature), each checked, joined by green
 * links, with the one gold CTA WELDED TO THE CHAIN'S END — the push is
 * the fifth station of the same line, gated on the checked APPROVE beside
 * it. Under it the tool's working adjacency: the segments table with REAL
 * transcript rows (a Loop UGC video, English → Japanese — the tool's own
 * job screen) beside the PORTRAIT player.
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5 as amended by U5/U6):
 * · NO `<img>`, NO filter — authored evidence, smoke-asserted per tool.
 * · FIFTEEN LETTERED ELEMENTS AND THAT IS THIS DRAWING'S SET — the
 *   budget's ceiling: the four steps, `UPLOAD`, the two column heads, and
 *   the EIGHT transcript cells, every one pinned by the smoke's
 *   sorted-array equality. PT Mono ≥8.6px (the CJK glyphs fall through
 *   the stack to the system mono — the computed family still reads
 *   PT Mono). NO DIGITS anywhere — the transcript lines are CHOSEN
 *   digit-free and currency-free (the envelope; segment lines with
 *   counts, sizes or prices may not be lettered here), and the rows'
 *   ticks stay the timecode's SHADOW — a mark, never digits.
 * · TWO SIGNAL COLOURS (U5): the flow is green — marks, labels, links —
 *   and exactly ONE solid gold plate, UPLOAD, above the veil at z 1.
 * · THE CONNECTORS ARE DIVS, NEVER SVG LINES — a stroked single-axis path
 *   reports a 0-height client rect and trips the smoke's collapse guard.
 * · The portrait read comes from the COLUMN's height-derived width
 *   (`min(47cqh, 24%)`), never an `aspect-ratio` on the screen (U3's
 *   measured trap).
 * · STATIC (ADR-021), `aria-hidden`, every element rule scoped
 *   `.fl-wire--babylon` — `.fl-wire__in`, `.fl-wire__lbl` and the U5
 *   grammar pair are the only shared classes.
 */
export function BabylonDubbingWireframe() {
  return (
    <div className="fl-wire fl-wire--babylon" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: the flow, ending at the send ── */}
        <div className="fl-wire__ba-chrome">
          <span className="fl-wire__ba-flow">
            <span className="fl-wire__ba-step">
              <svg className="fl-wire__ba-mark" viewBox="0 0 10 10">
                <path d="M2,5.2 L4.4,7.6 L8.4,2.8" />
              </svg>
              <span className="fl-wire__lbl fl-wire__lbl--grn">TRANSCRIBE</span>
            </span>
            <b className="fl-wire__ba-link" />
            <span className="fl-wire__ba-step">
              <svg className="fl-wire__ba-mark" viewBox="0 0 10 10">
                <path d="M2,5.2 L4.4,7.6 L8.4,2.8" />
              </svg>
              <span className="fl-wire__lbl fl-wire__lbl--grn">TRANSLATE</span>
            </span>
            <b className="fl-wire__ba-link" />
            <span className="fl-wire__ba-step">
              <svg className="fl-wire__ba-mark" viewBox="0 0 10 10">
                <path d="M2,5.2 L4.4,7.6 L8.4,2.8" />
              </svg>
              <span className="fl-wire__lbl fl-wire__lbl--grn">DUB</span>
            </span>
            <b className="fl-wire__ba-link" />
            <span className="fl-wire__ba-step">
              <svg className="fl-wire__ba-mark" viewBox="0 0 10 10">
                <path d="M2,5.2 L4.4,7.6 L8.4,2.8" />
              </svg>
              <span className="fl-wire__lbl fl-wire__lbl--grn">APPROVE</span>
            </span>
            <b className="fl-wire__ba-link" />
            {/* The ONE gold object: the push, the chain's last station. */}
            <span className="fl-wire__cta">
              <span className="fl-wire__lbl">UPLOAD</span>
            </span>
          </span>
        </div>

        <div className="fl-wire__ba-body">
          {/* ── the script: the real segments, original beside translation
              (a Loop UGC job, EN → JA — lines chosen digit-free) ── */}
          <div className="fl-wire__ba-script">
            <span className="fl-wire__ba-head">
              <span className="fl-wire__lbl">ORIGINAL</span>
              <span className="fl-wire__lbl">TRANSLATION</span>
            </span>
            <span className="fl-wire__ba-row" data-on="">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src">here&apos;s what you need to know.</b>
              <b className="fl-wire__ba-dst">これをチェックしてほしい。</b>
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src">Loop Quiet for focus,</b>
              <b className="fl-wire__ba-dst">集中にはLoop Quiet</b>
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src">They are reusable</b>
              <b className="fl-wire__ba-dst">Loopは再利用可能</b>
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src">so you can find your perfect fit.</b>
              <b className="fl-wire__ba-dst">完璧なフィットを見つけられる</b>
            </span>
          </div>

          {/* ── the player: the dubbed video with its source tabs ── */}
          <div className="fl-wire__ba-video">
            <span className="fl-wire__ba-tabs">
              <i data-on="" />
              <i />
              <i />
            </span>
            <span className="fl-wire__ba-screen">
              <i className="fl-wire__ba-play" />
              <i className="fl-wire__ba-capline" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

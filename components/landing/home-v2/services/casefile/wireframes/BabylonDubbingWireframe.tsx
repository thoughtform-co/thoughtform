/**
 * BabylonDubbingWireframe — the UGC Dubber's job screen, drawn (ADR-068 U5,
 * owner 2026-08-09: "a super clear flow as in the tool TRANSCRIBE -
 * TRANSLATE - DUB - APPROVE and then one clear CTA button SEND TO
 * FRONTIFY").
 *
 *   ┌ ✓TRANSCRIBE ─ ✓TRANSLATE ─ ✓DUB ─ ✓APPROVE  [SEND TO FRONTIFY] ┐
 *   │ ORIGINAL        TRANSLATION      │ ▭ tabs     │
 *   │ ▏═══════════    ═════════        │ ┌────────┐ │
 *   │ ▏═════════      ═══════════      │ │        │ │
 *   │ ▏══════════     ════════         │ │   ▶    │ │
 *   │ ▏════════       ══════════       │ │  ▬▬▬   │ │
 *   └──────────────────────────────────┴─┴────────┴─┘
 *
 * THE ARCHETYPE: the PIPELINE is the picture now — four green lettered
 * steps, each checked, joined by green hairlines, with the one gold CTA at
 * the line's end. Under it the tool's working adjacency survives from U3:
 * a two-column TABLE (spoken words) beside a PORTRAIT player (the vertical
 * video they belong to). The real screen's stepper reads Transcribe →
 * Translate → Dub → Approved; its send action is the Frontify push, gated
 * on approval — which is exactly the left-to-right story the chrome line
 * tells. The U3 title bar, unlabelled pipe chips and the SYNC foot plate
 * are DELETED (the CTA moved up to end the flow).
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5 as amended by U5):
 * · NO `<img>`, NO filter — authored evidence, smoke-asserted per tool.
 * · SEVEN LETTERED ELEMENTS AND THAT IS THIS DRAWING'S SET — the budget's
 *   ceiling (`TRANSCRIBE`, `TRANSLATE`, `DUB`, `APPROVE`, `ORIGINAL`,
 *   `TRANSLATION`, `SEND TO FRONTIFY`). PT Mono ≥8.6px, NO DIGITS anywhere
 *   (the rows' ticks stay the timecode's SHADOW — a mark, never digits).
 * · TWO SIGNAL COLOURS (U5): the flow is green — marks, labels and links,
 *   the machine's own rail — and exactly ONE solid gold plate, the CTA.
 *   The lit tab and the play cue went neutral with the same ruling.
 * · THE CONNECTORS ARE DIVS, NEVER SVG LINES — a stroked single-axis path
 *   reports a 0-height client rect and trips the smoke's collapse guard.
 * · The portrait read comes from the COLUMN's height-derived width
 *   (`min(47cqh, 24%)`), never an `aspect-ratio` on the screen (U3's
 *   measured trap: an intrinsic ratio overflows the row).
 * · STATIC (ADR-021), `aria-hidden`, every element rule scoped
 *   `.fl-wire--babylon` — `.fl-wire__in`, `.fl-wire__lbl` and the U5
 *   grammar pair are the only shared classes.
 */
export function BabylonDubbingWireframe() {
  return (
    <div className="fl-wire fl-wire--babylon" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: the flow, then the send ── */}
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
          </span>
          {/* The ONE gold object: the push, where the flow ends. */}
          <span className="fl-wire__cta">
            <span className="fl-wire__lbl">SEND TO FRONTIFY</span>
          </span>
        </div>

        <div className="fl-wire__ba-body">
          {/* ── the script: original beside translation ── */}
          <div className="fl-wire__ba-script">
            <span className="fl-wire__ba-head">
              <span className="fl-wire__lbl">ORIGINAL</span>
              <span className="fl-wire__lbl">TRANSLATION</span>
            </span>
            <span className="fl-wire__ba-row" data-on="">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src" />
              <b className="fl-wire__ba-dst" />
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src fl-wire__ba-src--mid" />
              <b className="fl-wire__ba-dst fl-wire__ba-dst--long" />
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src" />
              <b className="fl-wire__ba-dst fl-wire__ba-dst--short" />
            </span>
            <span className="fl-wire__ba-row">
              <i className="fl-wire__ba-tick" />
              <b className="fl-wire__ba-src fl-wire__ba-src--short" />
              <b className="fl-wire__ba-dst" />
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

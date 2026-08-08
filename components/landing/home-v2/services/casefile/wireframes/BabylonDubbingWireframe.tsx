/**
 * BabylonDubbingWireframe — the UGC Dubber's job screen, drawn (ADR-068 U3,
 * owner 2026-08-08: "on the right side we have the video and on the left
 * panel we have a transcription, a translation, and a button").
 *
 *   ┌ ttl ──────────────────── ◇──◇──◇──◇ pipeline ┐   chrome
 *   │ ORIGINAL        TRANSLATION      │ ▭ tabs     │
 *   │ ▏═══════════    ═════════        │ ┌────────┐ │
 *   │ ▏═════════      ═══════════      │ │        │ │
 *   │ ▏══════════     ════════         │ │   ▶    │ │
 *   │ ▏════════       ══════════       │ │        │ │
 *   │ [ SYNC ]                         │ │  ▬▬▬   │ │
 *   └──────────────────────────────────┴─┴────────┴─┘
 *
 * THE ARCHETYPE: a two-column TABLE beside a PORTRAIT player — the whole
 * tool is that adjacency (spoken words on the left, the vertical video
 * they belong to on the right). The real screen is a 50/50 grid: pipeline
 * chips (Transcribe → Translate → Dub → Approved), a segments table with
 * exactly Time | Original | Translation, and a 9:16 `VideoPanel` with a
 * source-tab row; its primary actions are Download / Send to Frontify.
 *
 * What the drawing keeps, and nothing more:
 * · The PIPELINE as four chamfer-cornered chips on the chrome line, three
 *   filled (done) and the last hollow — the machine mid-run. No words on
 *   them: the chips' shape and count are the read.
 * · The SEGMENTS as four rows of paired bars under the two column labels,
 *   each row led by a short mono TICK (the timecode's shadow — a mark, not
 *   digits: the ordinal scan reads this text).
 * · The one BUTTON (the owner's word) as the gold SYNC plate, bottom-left,
 *   where the send action lives.
 * · The VIDEO as a portrait frame — width derived from its height so it
 *   stays 9:16-ish without lettering a ratio — with the house play cue and
 *   a caption bar low in the frame (the burnt-in captions), plus a tab row
 *   above it (three cells, first lit = the dubbed source).
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5): no `<img>`, no filter; THREE
 * micro-labels (`ORIGINAL`, `TRANSLATION`, `SYNC`) and no digits anywhere;
 * gold is the only signal colour (the lit chip fills, the lit tab, the
 * SYNC plate, the play cue); static (ADR-021); `aria-hidden`; every
 * element rule scoped `.fl-wire--babylon`.
 */
export function BabylonDubbingWireframe() {
  return (
    <div className="fl-wire fl-wire--babylon" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: title · the pipeline ── */}
        <div className="fl-wire__ba-chrome">
          <i className="fl-wire__ba-ttl" />
          <span className="fl-wire__ba-pipe">
            <i data-on="" />
            <b />
            <i data-on="" />
            <b />
            <i data-on="" />
            <b />
            <i />
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
            {/* The one button, where the send action lives. */}
            <span className="fl-wire__ba-foot">
              <svg className="fl-wire__ba-sync" viewBox="0 0 68 14" preserveAspectRatio="none">
                <path d="M0,0 H62 L68,6 V14 H6 L0,8 Z" />
              </svg>
              <span className="fl-wire__lbl">SYNC</span>
            </span>
          </div>

          {/* ── the player: a portrait video with its source tabs ── */}
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

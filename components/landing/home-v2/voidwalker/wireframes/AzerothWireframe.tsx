/**
 * The locked-down classroom (2020) — a raid HUD read as a classroom: the
 * minimap (the lit "you" and the students), the online roster, the chat
 * log tagged CLASS (green, the flow), and the quest panel with the
 * assignment and the one gold object, ACCEPT. An action bar runs the foot.
 * Labels: MINIMAP · ONLINE · CLASS · ASSIGNMENT · ACCEPT.
 */
export function AzerothWireframe() {
  return (
    <div className="vw-wire vw-wire--azeroth" aria-hidden="true">
      <div className="vw-wire__in">
        <div className="vw-wire__az-top">
          {/* ── the minimap ── */}
          <span className="vw-wire__az-mini">
            <span className="vw-wire__lbl">MINIMAP</span>
            <span className="vw-wire__az-map">
              <i data-on="" />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
          {/* ── the chat log ── */}
          <span className="vw-wire__az-chat">
            <span className="vw-wire__lbl vw-wire__lbl--grn">CLASS</span>
            <span className="vw-wire__az-row">
              <i />
              <b className="vw-wire__bar" />
            </span>
            <span className="vw-wire__az-row">
              <i />
              <b className="vw-wire__bar vw-wire__bar--mid" />
            </span>
            <span className="vw-wire__az-row">
              <i />
              <b className="vw-wire__bar vw-wire__bar--short" />
            </span>
            <span className="vw-wire__az-row">
              <i />
              <b className="vw-wire__bar vw-wire__bar--mid" />
            </span>
          </span>
          {/* ── the roster + the quest ── */}
          <span className="vw-wire__az-side">
            <span className="vw-wire__az-roster">
              <span className="vw-wire__lbl">ONLINE</span>
              <b className="vw-wire__bar vw-wire__bar--short" />
              <b className="vw-wire__bar vw-wire__bar--mid" />
              <b className="vw-wire__bar vw-wire__bar--short" />
            </span>
            <span className="vw-wire__card vw-wire__az-quest">
              <span className="vw-wire__lbl">ASSIGNMENT</span>
              <span className="vw-wire__az-chk">
                <i data-on="" />
                <b className="vw-wire__bar" />
              </span>
              <span className="vw-wire__az-chk">
                <i />
                <b className="vw-wire__bar vw-wire__bar--mid" />
              </span>
              <span className="vw-wire__cta" data-gold="">
                <span className="vw-wire__lbl">ACCEPT</span>
              </span>
            </span>
          </span>
        </div>
        {/* ── the action bar ── */}
        <span className="vw-wire__az-bar">
          <i />
          <i data-on="" />
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

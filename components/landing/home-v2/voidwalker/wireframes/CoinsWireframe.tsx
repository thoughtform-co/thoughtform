/**
 * The coins (2018) — a Reddit post card (the vote column green, the flow)
 * beside ONE drawing: six coins in a breast-pocket cluster with the
 * bullet's line entering, kinking at the coin that took it, and stopping.
 * That coin is the one gold object — a MARK, not a plate (the artefact is
 * physical). Labels: POST · r/pics · UPVOTES · SIX COINS · THE BULLET.
 */
export function CoinsWireframe() {
  return (
    <div className="vw-wire vw-wire--coins" aria-hidden="true">
      <div className="vw-wire__in">
        {/* ── the post ── */}
        <div className="vw-wire__card vw-wire__co-post">
          <span className="vw-wire__co-vote">
            <svg className="vw-wire__co-up" viewBox="0 0 12 12" preserveAspectRatio="xMidYMid meet">
              <path d="M2,8 L6,3.5 L10,8" />
            </svg>
            <i className="vw-wire__co-meter">
              <b />
            </i>
            <span className="vw-wire__lbl vw-wire__lbl--grn">UPVOTES</span>
          </span>
          <span className="vw-wire__co-body">
            <span className="vw-wire__co-head">
              <span className="vw-wire__lbl vw-wire__lbl--as-is">r/pics</span>
              <span className="vw-wire__lbl">POST</span>
            </span>
            <b className="vw-wire__bar vw-wire__co-title" />
            <b className="vw-wire__bar" />
            <b className="vw-wire__bar vw-wire__bar--mid" />
          </span>
        </div>

        {/* ── the coins ── */}
        <div className="vw-wire__co-fig">
          <svg viewBox="0 0 120 88" preserveAspectRatio="xMidYMid meet">
            <g className="vw-wire__co-coins">
              <circle cx="30" cy="28" r="11" />
              <circle cx="58" cy="24" r="11" />
              <circle cx="86" cy="30" r="11" />
              <circle cx="40" cy="56" r="11" />
              <circle cx="68" cy="52" r="11" data-gold="" className="vw-wire__co-hit" />
              <circle cx="96" cy="60" r="11" />
            </g>
            <polyline className="vw-wire__co-bullet" points="4,84 30,70 56,58 62,54" />
          </svg>
          <span className="vw-wire__co-cap">
            <span className="vw-wire__lbl">SIX COINS</span>
            <span className="vw-wire__lbl">THE BULLET</span>
          </span>
        </div>
      </div>
    </div>
  );
}

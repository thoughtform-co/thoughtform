/**
 * OPHEF (2016) — a tweet card that becomes a party card, joined by one
 * connector with a diamond head. The hashtag and TRENDING are green (the
 * spread); the one gold object is JOIN on the party card. Labels: TWEET ·
 * #OPHEF · TRENDING · PARTY · PROGRAMME · JOIN.
 */
export function OphefWireframe() {
  return (
    <div className="vw-wire vw-wire--ophef" aria-hidden="true">
      <div className="vw-wire__in">
        <div className="vw-wire__op-body">
          {/* ── the tweet ── */}
          <div className="vw-wire__card vw-wire__op-tweet">
            <span className="vw-wire__op-head">
              <i className="vw-wire__op-avatar" />
              <b className="vw-wire__bar vw-wire__bar--short" />
              <span className="vw-wire__lbl">TWEET</span>
            </span>
            <b className="vw-wire__bar" />
            <b className="vw-wire__bar vw-wire__bar--mid" />
            <b className="vw-wire__bar vw-wire__bar--short" />
            <span className="vw-wire__op-meta">
              <span className="vw-wire__lbl vw-wire__lbl--grn vw-wire__lbl--as-is">#OPHEF</span>
              <svg
                className="vw-wire__op-repeat"
                viewBox="0 0 12 12"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M2,4.5 H8.5 L6.5,2.5 M10,7.5 H3.5 L5.5,9.5" />
              </svg>
              <span className="vw-wire__lbl vw-wire__lbl--grn">TRENDING</span>
            </span>
          </div>

          {/* ── the connector ── */}
          <span className="vw-wire__op-link">
            <i className="vw-wire__op-line" />
            <i className="vw-wire__op-diamond" />
          </span>

          {/* ── the party ── */}
          <div className="vw-wire__card vw-wire__op-party">
            <span className="vw-wire__op-mast">
              <span className="vw-wire__lbl">PARTY</span>
            </span>
            <b className="vw-wire__bar vw-wire__op-name" />
            <span className="vw-wire__lbl vw-wire__op-prog">PROGRAMME</span>
            <span className="vw-wire__op-k">
              <i />
              <b className="vw-wire__bar" />
            </span>
            <span className="vw-wire__op-k">
              <i />
              <b className="vw-wire__bar vw-wire__bar--mid" />
            </span>
            <span className="vw-wire__op-k">
              <i />
              <b className="vw-wire__bar vw-wire__bar--short" />
            </span>
            <span className="vw-wire__cta" data-gold="">
              <span className="vw-wire__lbl">JOIN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

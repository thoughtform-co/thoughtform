/**
 * Save The Expanse (2018) — the Discord command centre: a server rail, the
 * channel list (the campaign's four fronts, green — the flow), and on the
 * right the petition meter and the sky: a plane towing the one gold object,
 * the banner, over the studio. Labels: CHANNELS · TWEETSTORM · FACEBOOK ADS
 * · PETITION · BANNER PLANE · SIGNATURES · AMAZON STUDIOS · SAVE THE EXPANSE.
 */
export function ExpanseWireframe() {
  return (
    <div className="vw-wire vw-wire--expanse" aria-hidden="true">
      <div className="vw-wire__in">
        {/* ── the server rail ── */}
        <span className="vw-wire__ex-rail">
          <i />
          <i data-on="" />
          <i />
        </span>

        {/* ── the channels ── */}
        <div className="vw-wire__ex-chan">
          <span className="vw-wire__lbl vw-wire__ex-chan-hd">CHANNELS</span>
          <span className="vw-wire__ex-ch">
            <i />
            <span className="vw-wire__lbl vw-wire__lbl--grn">TWEETSTORM</span>
          </span>
          <span className="vw-wire__ex-ch" data-on="">
            <i />
            <span className="vw-wire__lbl vw-wire__lbl--grn">FACEBOOK ADS</span>
          </span>
          <span className="vw-wire__ex-ch">
            <i />
            <span className="vw-wire__lbl vw-wire__lbl--grn">PETITION</span>
          </span>
          <span className="vw-wire__ex-ch">
            <i />
            <span className="vw-wire__lbl vw-wire__lbl--grn">BANNER PLANE</span>
          </span>
        </div>

        {/* ── the main pane: the meter, then the sky ── */}
        <div className="vw-wire__ex-main">
          <span className="vw-wire__ex-meter">
            <span className="vw-wire__lbl">SIGNATURES</span>
            <i className="vw-wire__ex-track">
              <b className="vw-wire__ex-fill" />
            </i>
          </span>
          <span className="vw-wire__ex-sky">
            <span className="vw-wire__ex-flight">
              <svg
                className="vw-wire__ex-plane"
                viewBox="0 0 24 24"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M2,13 L9,12 L15,5 L17,6 L13,12 L21,12.5 L22,14 L13,14 L15,21 L13,21 L9,15 L4,16 Z" />
              </svg>
              <i className="vw-wire__ex-tow" />
              <span className="vw-wire__cta" data-gold="">
                <span className="vw-wire__lbl">SAVE THE EXPANSE</span>
              </span>
            </span>
            <span className="vw-wire__ex-studio">
              <i />
              <span className="vw-wire__lbl">AMAZON STUDIOS</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

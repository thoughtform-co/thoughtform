/**
 * The interlude's face (ADR-074 U2) — the ONE film on the through-line, drawn
 * rather than thumbnailed.
 *
 * ⚠ NO IMAGE, ON PURPOSE. A YouTube thumbnail is designed to win a feed: big
 * type, a face, a border. Dropping one into this rail is the exact complaint
 * that made the owner draw the six wireframes in the first place ("showing
 * the thumbnail broke with the style"). So the plate is our own chrome all
 * the way to the click, and the real player only exists inside the lightbox
 * — which is also why nothing third-party loads until someone asks for it,
 * and why `img-src` needs no new origin.
 *
 * The drawing is a frame in a viewer: a sprocket edge, a held frame with the
 * house image mark, a scrub bar part-run, and the one gold object — the play
 * key. Same law as the six: green is the flow, gold is the make, exactly one
 * `[data-gold]`, no digits inside the drawing (the runtime letters on the
 * plate's bar, which is chrome).
 */
export function FilmPlate() {
  return (
    <div className="vw-wire vw-wire--film" aria-hidden="true">
      <div className="vw-wire__in">
        <div className="vw-wire__fi-stage">
          {/* the sprocket edges — a strip, not a browser window */}
          <i className="vw-wire__fi-perf" />
          <span className="vw-wire__fi-frame">
            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <circle cx="15.5" cy="8" r="2.6" />
              <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
            </svg>
            <span className="vw-wire__cta" data-gold="">
              <svg
                className="vw-wire__fi-play"
                viewBox="0 0 12 14"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M1,1 L11,7 L1,13 Z" />
              </svg>
              <span className="vw-wire__lbl">PLAY</span>
            </span>
          </span>
          <i className="vw-wire__fi-perf" />
        </div>
        <div className="vw-wire__fi-transport">
          <span className="vw-wire__lbl vw-wire__lbl--grn">CAMPAIGN FILM</span>
          <i className="vw-wire__fi-track">
            <b className="vw-wire__fi-run" />
          </i>
        </div>
      </div>
    </div>
  );
}

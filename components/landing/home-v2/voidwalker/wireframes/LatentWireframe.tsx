/**
 * The GenAI wave (2022) — the hybrid film and the charter. A green chain
 * PROMPT → FRAMES → CUT welded to the one gold object, RENDER (the
 * casefile's babylon chain at micro scale); below it a film strip of
 * generated frames (the house image mark — a horizon and a sun, line work
 * not a picture) with a scrub bar, beside the charter page. Labels:
 * LATENT LAND · PROMPT · FRAMES · CUT · RENDER · CHARTER.
 */
function Frame() {
  return (
    <span className="vw-wire__la-frame">
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <circle cx="15.5" cy="8" r="2.6" />
        <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
      </svg>
    </span>
  );
}

export function LatentWireframe() {
  return (
    <div className="vw-wire vw-wire--latent" aria-hidden="true">
      <div className="vw-wire__in">
        {/* ── the chrome: the title and the chain ── */}
        <div className="vw-wire__la-chrome">
          <span className="vw-wire__lbl">LATENT LAND</span>
          <span className="vw-wire__la-chain">
            <span className="vw-wire__lbl vw-wire__lbl--grn">PROMPT</span>
            <i className="vw-wire__la-link" />
            <span className="vw-wire__lbl vw-wire__lbl--grn">FRAMES</span>
            <i className="vw-wire__la-link" />
            <span className="vw-wire__lbl vw-wire__lbl--grn">CUT</span>
            <i className="vw-wire__la-link" />
            <span className="vw-wire__cta" data-gold="">
              <span className="vw-wire__lbl">RENDER</span>
            </span>
          </span>
        </div>

        <div className="vw-wire__la-body">
          {/* ── the strip ── */}
          <span className="vw-wire__la-strip">
            <span className="vw-wire__la-frames">
              <Frame />
              <Frame />
              <Frame />
            </span>
            <i className="vw-wire__la-scrub">
              <b />
            </i>
          </span>
          {/* ── the charter ── */}
          <span className="vw-wire__card vw-wire__la-charter">
            <span className="vw-wire__lbl">CHARTER</span>
            <b className="vw-wire__bar vw-wire__la-head" />
            <span className="vw-wire__la-k">
              <i />
              <b className="vw-wire__bar" />
            </span>
            <span className="vw-wire__la-k">
              <i />
              <b className="vw-wire__bar vw-wire__bar--mid" />
            </span>
            <span className="vw-wire__la-k">
              <i />
              <b className="vw-wire__bar" />
            </span>
            <span className="vw-wire__la-sig">
              <b className="vw-wire__bar vw-wire__bar--short" />
              <b className="vw-wire__bar vw-wire__bar--short" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

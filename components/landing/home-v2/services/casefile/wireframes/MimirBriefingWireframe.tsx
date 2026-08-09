/**
 * MimirBriefingWireframe — the Briefing Agent's create-ads workspace, drawn
 * (ADR-068 U5, owner 2026-08-09: "in the Briefing Inputs a few clear titles
 * with source of input ADS DATA, REVIEWS, REDDIT, BLOGS… and on the right
 * side a clear wireframe of an ad").
 *
 *   ┌ ttl ─────────────────────────────────── ◻◻ studio/ugc ┐   chrome
 *   │ ┌ ADS DATA ──┐ │        ┌ the ad ────┐                │
 *   │ ├ REVIEWS ───┤ │        │    ◠  ▨    │                │
 *   │ ├ REDDIT ────┤ │        │  (image)   │                │
 *   │ ├ BLOGS ─────┤ │        │ ▬▬▬▬▬▬▬▬   │                │
 *   │ │            │ │        │ ▬▬▬▬▬      │                │
 *   │ [ GENERATE   ] │        │ [cta]      │                │
 *   │ [  BRIEFINGS ] │        └────────────┘                │
 *   └────────────────┴───────────────────────────────────────┘
 *
 * THE ARCHETYPE (owner, U5 — supersedes U3's three panels): evidence
 * sources IN on the left — four titled cards naming the tool's evidence
 * estate (ads data = Loop Ads + the Meta library; reviews; reddit = social
 * listening; blogs = trends) — the gold GENERATE BRIEFINGS plate at the
 * rail's foot exactly where the app's own CTA lives, and on the right the
 * AD the pipeline exists to produce: one portrait card with the image mark,
 * two headline bars and a CTA chip. The U3 brief and reference columns are
 * DELETED — inputs → the button → the ad is the whole story.
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5 as amended by U5):
 * · NO `<img>`, NO filter — authored evidence, smoke-asserted per tool.
 * · FIVE LETTERED ELEMENTS AND THAT IS THIS DRAWING'S SET (`ADS DATA`,
 *   `REVIEWS`, `REDDIT`, `BLOGS`, `GENERATE BRIEFINGS`) — the smoke pins
 *   every text-bearing element by sorted-array equality. PT Mono ≥8.6px,
 *   NO DIGITS anywhere (the bay's ordinal scan reads this text).
 * · TWO SIGNAL COLOURS (U5): green ink on the source titles — the
 *   operational flow — and exactly ONE solid gold plate, the CTA. The seg
 *   pill's lit cell went neutral with the same ruling.
 * · THE AD FRAME'S WIDTH IS HEIGHT-DERIVED (`min(64%, 66cqh)`) — never an
 *   `aspect-ratio` on a flex row (the babylon trap, ADR-068 U3).
 * · STATIC (ADR-021), `aria-hidden` (the frame is the button), and every
 *   element rule is scoped `.fl-wire--mimir` — `.fl-wire__in`,
 *   `.fl-wire__lbl` and the U5 grammar pair are the only shared classes.
 */
export function MimirBriefingWireframe() {
  return (
    <div className="fl-wire fl-wire--mimir" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: title · mode pill ── */}
        <div className="fl-wire__mi-chrome">
          <i className="fl-wire__mi-ttl" />
          <span className="fl-wire__mi-seg">
            <i data-on="" />
            <i />
          </span>
        </div>

        <div className="fl-wire__mi-body">
          {/* ── Briefing Inputs: four titled sources, then the button ── */}
          <div className="fl-wire__mi-rail">
            <span className="fl-wire__mi-src">
              <span className="fl-wire__lbl fl-wire__lbl--grn">ADS DATA</span>
              <i />
              <i />
            </span>
            <span className="fl-wire__mi-src">
              <span className="fl-wire__lbl fl-wire__lbl--grn">REVIEWS</span>
              <i />
              <i />
            </span>
            <span className="fl-wire__mi-src">
              <span className="fl-wire__lbl fl-wire__lbl--grn">REDDIT</span>
              <i />
              <i />
            </span>
            <span className="fl-wire__mi-src">
              <span className="fl-wire__lbl fl-wire__lbl--grn">BLOGS</span>
              <i />
              <i />
            </span>
            {/* The ONE gold object: the app's own CTA, at the rail's foot. */}
            <span className="fl-wire__cta">
              <span className="fl-wire__lbl">GENERATE BRIEFINGS</span>
            </span>
          </div>

          {/* ── the ad the briefing becomes ── */}
          <div className="fl-wire__mi-ad">
            <span className="fl-wire__mi-adframe">
              <span className="fl-wire__mi-adimg">
                {/* The image mark — a horizon and a sun, the oldest
                    placeholder there is. Line work, not a picture. */}
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                  <circle cx="15.5" cy="8" r="2.6" />
                  <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
                </svg>
              </span>
              <i className="fl-wire__mi-adhead" />
              <i className="fl-wire__mi-adhead fl-wire__mi-adhead--short" />
              <i className="fl-wire__mi-adcta" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

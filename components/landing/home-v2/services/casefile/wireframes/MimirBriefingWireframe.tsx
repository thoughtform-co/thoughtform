/**
 * MimirBriefingWireframe — the Briefing Agent's create-ads workspace, drawn
 * (ADR-068 U5; recomposed U6, owner 2026-08-09: "there should be a panel in
 * the middle called Briefing… add clear labels to each of these three
 * panels: INPUT / BRIEFING / AD. The ad panel can be slightly thinner").
 *
 *   ┌ ttl ─────────────────────────────────── ◻◻ studio/ugc ┐   chrome
 *   │ INPUT          │ BRIEFING              │ AD           │
 *   │ ┌ ADS DATA ──┐ │ ● ▬▬                  │ ┌──────────┐ │
 *   │ ├ REVIEWS ───┤ │   ═══════ ══════      │ │   ◠ ▨    │ │
 *   │ ├ REDDIT ────┤ │ ● ▬▬                  │ │ (image)  │ │
 *   │ ├ BLOGS ─────┤ │   ═════ ════════      │ │ ▬▬▬▬▬    │ │
 *   │ [ GENERATE   ] │ ● ▬▬  ☐ ☐ ☐           │ │ [cta]    │ │
 *   │ [  BRIEFINGS ] │                       │ └──────────┘ │
 *   └────────────────┴───────────────────────┴──────────────┘
 *
 * THE ARCHETYPE (owner, U6): the pipeline in three lettered panels —
 * evidence IN (four titled sources: Loop Ads + the Meta library, reviews,
 * social listening, trends), the BRIEFING taking shape in the middle
 * (kicker-dot sections, the formats checks), and the AD it becomes on the
 * right, slightly thinner so the document owns the centre. The one gold
 * object stays the GENERATE BRIEFINGS plate at the input rail's foot.
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5 as amended by U5/U6):
 * · NO `<img>`, NO filter — authored evidence, smoke-asserted per tool.
 * · EIGHT LETTERED ELEMENTS AND THAT IS THIS DRAWING'S SET (`INPUT`,
 *   `ADS DATA`, `REVIEWS`, `REDDIT`, `BLOGS`, `GENERATE BRIEFINGS`,
 *   `BRIEFING`, `AD`) — the smoke pins every text-bearing element by
 *   sorted-array equality. PT Mono ≥8.6px, NO DIGITS anywhere.
 * · TWO SIGNAL COLOURS: green ink on the source titles (the operational
 *   flow), exactly ONE solid gold plate (the CTA, above the veil at z 1).
 *   Panel headers are neutral chrome; the brief's kicker dots and checks
 *   are neutral too — U3's gold dots would dilute the one-gold law.
 * · THE AD COLUMN CARRIES THE PORTRAIT READ AS A DEFINITE FLEX BASIS
 *   (`clamp(130px, 26%, 220px)`) — never an `aspect-ratio` on the frame
 *   (the babylon trap, ADR-068 U3).
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
          {/* ── INPUT: four titled sources, then the button ── */}
          <div className="fl-wire__mi-rail">
            <span className="fl-wire__lbl">INPUT</span>
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

          {/* ── BRIEFING: the document taking shape ── */}
          <div className="fl-wire__mi-brief">
            <span className="fl-wire__lbl">BRIEFING</span>
            <span className="fl-wire__mi-sec">
              <b className="fl-wire__mi-kick">
                <i className="fl-wire__mi-dot" />
                <i className="fl-wire__mi-kbar" />
              </b>
              <i className="fl-wire__mi-line" />
              <i className="fl-wire__mi-line fl-wire__mi-line--short" />
            </span>
            <span className="fl-wire__mi-sec">
              <b className="fl-wire__mi-kick">
                <i className="fl-wire__mi-dot" />
                <i className="fl-wire__mi-kbar" />
              </b>
              <i className="fl-wire__mi-line fl-wire__mi-line--mid" />
              <i className="fl-wire__mi-line" />
            </span>
            <span className="fl-wire__mi-sec">
              <b className="fl-wire__mi-kick">
                <i className="fl-wire__mi-dot" />
                <i className="fl-wire__mi-kbar" />
              </b>
              {/* FORMATS: the one checklist section — three boxes, first
                  ticked with a filled inner square, neutral since U5. */}
              <b className="fl-wire__mi-checks">
                <i data-on="" />
                <i />
                <i />
              </b>
            </span>
          </div>

          {/* ── AD: what the briefing becomes ── */}
          <div className="fl-wire__mi-ad">
            <span className="fl-wire__lbl">AD</span>
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

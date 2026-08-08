/**
 * MimirBriefingWireframe — the Briefing Agent's create-ads workspace, drawn
 * (ADR-068 U3, owner 2026-08-08: "make a super simple version of it… really
 * think about the archetype").
 *
 *   ┌ ttl ─────────── ◻◻ studio/ugc ───────────── send ┐   chrome
 *   │ INSIGHTS      │ BRIEFING                │ REFERENCE│
 *   │ ┌ nugget ───┐ │ ● ▬▬                    │ ┌──────┐ │
 *   │ ├ nugget ───┤ │   ═══════ ══════        │ │  ▨   │ │
 *   │ ├ nugget ───┤ │ ● ▬▬                    │ │      │ │
 *   │ ┆ add more  ┆ │   ═════ ════════        │ └──────┘ │
 *   │ [ GENERATE ]  │ ● ▬▬  ☐ ☐ ☐             │  caption │
 *   └───────────────┴─────────────────────────┴──────────┘
 *
 * THE ARCHETYPE (owner's own three panels): evidence goes IN on the left,
 * the brief takes shape in the middle, the reference image sits on the
 * right. The real app is a focused two-column workspace (left
 * `BriefingSourceRail`, centre `BriefingComposer` with References inline at
 * its bottom); the owner's abstraction promotes the reference to a third
 * panel, which is the drawing's whole argument — inputs → brief → visual.
 *
 * What each panel keeps from the real UI, and nothing more:
 * · INSIGHTS — the nugget-card stack (two bars + meta dots each), the
 *   dashed "+ add more sources" row, and the one gold action: the GENERATE
 *   plate at the rail's foot, exactly where the app's own CTA lives.
 * · BRIEFING — the kicker-dot section grammar (IDEA / WHY / … render as a
 *   gold dot + a short kicker bar), two body bars per section, and the
 *   FORMATS checkbox row. Borderless, like the app's composer.
 * · REFERENCE — one portrait frame with the image mark, a caption bar.
 * · CHROME — title bar left; the STUDIO/UGC segmented pill (two cells, one
 *   lit — the app's one visible mode switch); the send plate right (the
 *   "Save & send to Monday" primary, drawn as the house chamfer plate).
 *
 * THE RULES THIS DRAWING KEEPS (the ADR-068 D5 contract, verbatim law):
 * · NO `<img>`, NO filter — authored evidence, smoke-asserted per tool.
 * · THREE MICRO-LABELS AND THAT IS THE BUDGET (`INSIGHTS`, `BRIEFING`,
 *   `REFERENCE`) — PT Mono via `.fl-wire__lbl`, ≥8.6px. NO DIGITS anywhere
 *   (the bay's ordinal scan reads this text).
 * · GOLD IS THE ONLY SIGNAL COLOUR: the kicker dots, the lit segment cell,
 *   the GENERATE plate, the send plate. Green stays provenance.
 * · STATIC (ADR-021), `aria-hidden` (the frame is the button), and every
 *   element rule is scoped `.fl-wire--mimir` — `.fl-wire__in` and
 *   `.fl-wire__lbl` are the only shared classes.
 */
export function MimirBriefingWireframe() {
  return (
    <div className="fl-wire fl-wire--mimir" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: title · mode pill · send ── */}
        <div className="fl-wire__mi-chrome">
          <i className="fl-wire__mi-ttl" />
          <span className="fl-wire__mi-seg">
            <i data-on="" />
            <i />
          </span>
          <svg className="fl-wire__mi-send" viewBox="0 0 68 14" preserveAspectRatio="none">
            <path d="M0,0 H62 L68,6 V14 H6 L0,8 Z" />
          </svg>
        </div>

        <div className="fl-wire__mi-body">
          {/* ── the insights rail: evidence in ── */}
          <div className="fl-wire__mi-rail">
            <span className="fl-wire__lbl">INSIGHTS</span>
            <span className="fl-wire__mi-card">
              <i />
              <i />
              <b>
                <u />
                <u />
              </b>
            </span>
            <span className="fl-wire__mi-card">
              <i />
              <i />
              <b>
                <u />
                <u />
              </b>
            </span>
            <span className="fl-wire__mi-card">
              <i />
              <i />
              <b>
                <u />
                <u />
              </b>
            </span>
            <span className="fl-wire__mi-add">
              <svg viewBox="0 0 12 12">
                <path d="M6,3.4 V8.6 M3.4,6 H8.6" />
              </svg>
            </span>
            {/* The rail's one action, at its foot like the app's own CTA. */}
            <svg className="fl-wire__mi-gen" viewBox="0 0 68 14" preserveAspectRatio="none">
              <path d="M0,0 H62 L68,6 V14 H6 L0,8 Z" />
            </svg>
          </div>

          {/* ── the brief: kicker-dot sections taking shape ── */}
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
                  ticked (a filled inner square, not a glyph). */}
              <b className="fl-wire__mi-checks">
                <i data-on="" />
                <i />
                <i />
              </b>
            </span>
          </div>

          {/* ── the reference: the visual the brief points at ── */}
          <div className="fl-wire__mi-ref">
            <span className="fl-wire__lbl">REFERENCE</span>
            <span className="fl-wire__mi-frame">
              {/* The image mark — a horizon and a sun, the oldest
                  placeholder there is. Line work, not a picture. */}
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                <circle cx="15.5" cy="8" r="2.6" />
                <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
              </svg>
            </span>
            <i className="fl-wire__mi-cap" />
          </div>
        </div>
      </div>
    </div>
  );
}

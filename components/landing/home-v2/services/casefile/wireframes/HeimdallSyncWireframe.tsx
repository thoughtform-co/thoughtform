/**
 * HeimdallSyncWireframe — the Studio PM Orchestrator where it actually
 * lives: a plugin panel over the Figma canvas, and the template it
 * generates (ADR-068 U3, owner 2026-08-08: "it lives in Figma so we need a
 * plugin panel where we can import briefings. It generates a template in
 * Figma where we can place copy, inspiration, etc.").
 *
 *   ┌ ttl ───────────────────────────────── ▭ zoom ┐   chrome
 *   │ ┌ BRIEFINGS ─┐ ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  │
 *   │ │ ☐ ══════ ▎ │   ┌ ref ┐ ┌ brief ──┐ ┌ copy ┐ │
 *   │ │ ☑ ════   ▎ │   │  ▨  │ │ ▬▬▬▬    │ │ ▭ ══ │ │
 *   │ │ ☐ ═════  ▎ │   │     │ │ ═══ ═══ │ │ ▭ ══ │ │
 *   │ │ ☐ ═══    ▎ │   └─────┘ │ ═══     │ └──────┘ │
 *   │ │ [ SYNC ]   │   TEMPLATE└─────────┘          │
 *   └──────────────┴──────────────────────────────────┘
 *
 * THE ARCHETYPE: a PANEL beside a CANVAS. Every other tool here is its own
 * app; Heimdall is a resident — the drawing has to say "inside Figma"
 * without naming Figma, and a floating plugin panel over a dotted
 * infinite canvas is that statement. The real panel (500×700) is a
 * briefing LIST — checkbox + name + status edge per row — over one primary
 * action (`Sync N briefing(s)`); the real output is a Section of columns:
 * References · Briefing (status pill + structured brief) · Copy
 * (Variation frames). One of each survives abstraction.
 *
 * What the drawing keeps, and nothing more:
 * · The PLUGIN PANEL as the one OPAQUE plate (the vesper composer's move):
 *   four briefing rows — checkbox square, name bar, and a STATUS TICK on
 *   the row's right edge (the app's colored left-border badge, moved to
 *   the free edge; the synced row's tick is lit) — over the gold SYNC
 *   plate. The second row is checked and lit: work mid-import.
 * · The CANVAS as a dotted ground (`--w-hair2` radial dots — the one
 *   universal "design canvas" read) carrying the GENERATED template:
 *   a reference frame with the image mark, the briefing column (dark
 *   header bar + body bars), the copy column (two stacked variation
 *   cards, header bar + line each).
 * · The chrome stays FIGMA-QUIET: a title bar and one hollow zoom pill —
 *   a canvas app's chrome is famously not the point.
 *
 * THE RULES THIS DRAWING KEEPS (ADR-068 D5): no `<img>`, no filter; THREE
 * micro-labels (`BRIEFINGS`, `SYNC`, `TEMPLATE`) and no digits anywhere;
 * gold is the only signal colour (the checked row, the status tick, the
 * SYNC plate); static (ADR-021); `aria-hidden`; every element rule scoped
 * `.fl-wire--heimdall`.
 */
export function HeimdallSyncWireframe() {
  return (
    <div className="fl-wire fl-wire--heimdall" aria-hidden="true">
      <div className="fl-wire__in">
        {/* ── chrome: title · zoom pill ── */}
        <div className="fl-wire__he-chrome">
          <i className="fl-wire__he-ttl" />
          <i className="fl-wire__he-zoom" />
        </div>

        <div className="fl-wire__he-body">
          {/* ── the plugin panel: briefings in, one action ── */}
          <div className="fl-wire__he-panel">
            <span className="fl-wire__lbl">BRIEFINGS</span>
            <span className="fl-wire__he-row">
              <i className="fl-wire__he-box" />
              <b className="fl-wire__he-name" />
              <i className="fl-wire__he-status" />
            </span>
            <span className="fl-wire__he-row" data-on="">
              <i className="fl-wire__he-box" data-on="" />
              <b className="fl-wire__he-name fl-wire__he-name--short" />
              <i className="fl-wire__he-status" data-on="" />
            </span>
            <span className="fl-wire__he-row">
              <i className="fl-wire__he-box" />
              <b className="fl-wire__he-name fl-wire__he-name--mid" />
              <i className="fl-wire__he-status" />
            </span>
            <span className="fl-wire__he-row">
              <i className="fl-wire__he-box" />
              <b className="fl-wire__he-name fl-wire__he-name--short" />
              <i className="fl-wire__he-status" />
            </span>
            <span className="fl-wire__he-foot">
              <svg className="fl-wire__he-sync" viewBox="0 0 68 14" preserveAspectRatio="none">
                <path d="M0,0 H62 L68,6 V14 H6 L0,8 Z" />
              </svg>
              <span className="fl-wire__lbl">SYNC</span>
            </span>
          </div>

          {/* ── the canvas: what the sync generated ── */}
          <div className="fl-wire__he-canvas">
            <span className="fl-wire__he-col fl-wire__he-col--ref">
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                <circle cx="15.5" cy="8" r="2.6" />
                <path d="M2,19 L9.5,11 L14,15.5 L17.5,12.5 L22,17" />
              </svg>
            </span>
            <span className="fl-wire__he-col fl-wire__he-col--brief">
              <i className="fl-wire__he-hd" />
              <b className="fl-wire__he-line" />
              <b className="fl-wire__he-line fl-wire__he-line--short" />
              <b className="fl-wire__he-line fl-wire__he-line--mid" />
            </span>
            <span className="fl-wire__he-col fl-wire__he-col--copy">
              <span className="fl-wire__he-var">
                <i className="fl-wire__he-hd" />
                <b className="fl-wire__he-line fl-wire__he-line--short" />
              </span>
              <span className="fl-wire__he-var">
                <i className="fl-wire__he-hd" />
                <b className="fl-wire__he-line fl-wire__he-line--mid" />
              </span>
            </span>
            <span className="fl-wire__lbl fl-wire__he-cap">TEMPLATE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

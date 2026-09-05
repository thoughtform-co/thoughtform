/**
 * The sheet's CONTROLS — stations, buttons, directory rows and readouts. The
 * four specimens where a STATE has to be drawn, so each one prints its states
 * side by side rather than needing a pointer to reveal them.
 *
 * ⚠ STATES ARE `data-state`, NOT `:hover`. A still cannot hover, and the whole
 * point of the wave is that a state can be judged in a screenshot. The live
 * pseudo-classes stay on the production leaves in the panel view; here every
 * state is addressable.
 */

/* ── Stations ─────────────────────────────────────────────────────────────
 * The console rail's three candidate selections, on a real `.fl-con__rail`
 * clone so the box, the gap and the diamond are production's own.
 *
 *   fill     ADR-089 U4's inverse video — the open box takes `--gold`, ink and
 *            diamond knocked out on `--gold-contrast`
 *   line     no fill; a 1px accent line on the open box's bottom edge
 *   outline  an accent border, no fill, the label at full ink
 *
 * The ruling U4 recorded is that the variable was never AREA but FILL AMONG
 * OUTLINES — a bounded 201×33 box among three outlined peers reads as this
 * box's state, where a full-bleed plate read as a region of the console going
 * gold. `line` and `outline` are the two ways to keep the box and spend no
 * fill at all.
 */
const STATIONS = ["WORK", "CONFIGURATION", "SUBSTRATE"];

export function Stations() {
  return (
    <div className="ik-stations">
      {(["fill", "line", "outline"] as const).map((mode) => (
        <div className="ik-stations__case" key={mode}>
          <span className="ik-stations__k">{mode}</span>
          <div className="ik-rail" data-mode={mode} role="presentation">
            {STATIONS.map((s, i) => (
              <span className="ik-stn" key={s} data-on={i === 0 ? "" : undefined}>
                <i aria-hidden="true" />
                <b>{s}</b>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Buttons ──────────────────────────────────────────────────────────────
 * Three ranks, four states each. The casefile carries no button today — the
 * surface's one affordance is the fused watch bar — so this specimen is what
 * the house already ships elsewhere (`landing.css`'s `.btn` family and the
 * hero's CTA pair), gathered so the ranks can be seen as a set.
 *
 * ⚠ INK ON A GOLD FILL IS `--gold-contrast`, NEVER `--void` (ADR-058). The two
 * are byte-equal in dark; in light `--void` IS the parchment ground and lands
 * around 3:1 on the darkened gold.
 */
const BTN_STATES = ["default", "hover", "active", "disabled"] as const;

export function Buttons() {
  return (
    <div className="ik-buttons">
      {(["primary", "secondary", "tertiary"] as const).map((rank) => (
        <div className="ik-buttons__rank" key={rank}>
          <span className="ik-buttons__k">{rank}</span>
          <div className="ik-buttons__set">
            {BTN_STATES.map((state) => (
              <button
                type="button"
                className="ik-btn-spec"
                key={state}
                data-rank={rank}
                data-state={state}
                disabled={state === "disabled"}
                tabIndex={-1}
              >
                Read the docs
                <i className="ik-btn-spec__arrow" aria-hidden="true">
                  →
                </i>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Directory rows ───────────────────────────────────────────────────────
 * The casefile's real navigation, drawn at three states.
 *
 * ⚠ THE ACTIVE ROW IS THE PANEL'S ONE UNAMBIGUOUS ACCENT SPEND, and it carries
 * a `box-shadow: 0 0 18px` glow in production against a shape law that says no
 * glows. The `flat` material knob takes it off; the specimen exists so the two
 * can be read against each other rather than argued about.
 */
const ROWS = [
  { file: "01_INTELLIGENCE-MAP/", meta: "27 → 47", icon: "dir" },
  { file: "02_SOFTWARE-FOR-FEW/", meta: "4 TOOLS", icon: "doc" },
  { file: "03_AI-FLUENCY-STUDIO/", meta: "500 ADS/MO", icon: "doc" },
  { file: "04_AI-ABOVE-THE-LINE/", meta: "2 FILMS", icon: "doc" },
];

export function Rows() {
  return (
    <div className="ik-rows">
      <div className="ik-rows__head">
        <span className="ik-lbl" data-form="eyebrow">
          DIRECTORY · /LOOP-EARPLUGS/
        </span>
        <span className="ik-lbl" data-form="count">
          4 ITEMS
        </span>
      </div>
      <ul className="ik-rows__list">
        {ROWS.map((r, i) => (
          <li key={r.file}>
            <span
              className="ik-row"
              data-state={i === 0 ? "active" : i === 1 ? "hover" : "default"}
            >
              <i className="ik-row__glyph" data-icon={r.icon} aria-hidden="true" />
              <span className="ik-row__file">{r.file}</span>
              <span className="ik-row__meta">{r.meta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Readouts ─────────────────────────────────────────────────────────────
 * A key/value pair in both orientations, a four-cell stat strip and a bench row
 * with a meter — the three shapes a record takes when it is not prose.
 *
 * ⚠ A METER WITHOUT A UNIT IS DECORATION. The corpus's own note on this
 * reference set names it exactly: four cards with charts carrying no legible
 * data are "a Data Readout that is actually just decoration". Every bar below
 * prints its own figure beside it.
 */
const STATS = [
  { k: "FSYNC", v: "4.1×" },
  { k: "SEQ WRITE", v: "2.8×" },
  { k: "RAND READ", v: "1.9×" },
  { k: "COLD START", v: "84ms" },
];
const BENCH = [
  { name: "TENSORLAKE", t: "2.45s", w: 100, lit: true },
  { name: "VERCEL", t: "3.00s", w: 82 },
  { name: "E2B", t: "3.92s", w: 63 },
  { name: "MODAL", t: "4.66s", w: 53 },
];

export function Readouts() {
  return (
    <div className="ik-readouts">
      <div className="ik-readouts__pair">
        <span className="ik-kv" data-dir="h">
          <span className="ik-kv__k">BEARING</span>
          <i className="ik-kv__rule" aria-hidden="true" />
          <span className="ik-kv__v">078</span>
        </span>
        <span className="ik-kv" data-dir="v">
          <span className="ik-kv__k">SECTOR</span>
          <span className="ik-kv__v">02/07</span>
        </span>
      </div>

      <div className="ik-stats">
        {STATS.map((s) => (
          <div className="ik-stats__cell" key={s.k}>
            <span className="ik-stats__k">{s.k}</span>
            <span className="ik-stats__v">{s.v}</span>
          </div>
        ))}
      </div>

      <div className="ik-bench">
        {BENCH.map((b) => (
          <div className="ik-bench__row" key={b.name} data-lit={b.lit || undefined}>
            <span className="ik-bench__name">{b.name}</span>
            <span className="ik-bench__track" aria-hidden="true">
              <i style={{ width: `${b.w}%` }} />
            </span>
            <span className="ik-bench__t">{b.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

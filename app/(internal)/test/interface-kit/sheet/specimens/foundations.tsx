/**
 * The sheet's FOUNDATIONS — the line ladder, the type ladder, the marks and the
 * label grammar. Four specimens in one file because each is a dozen lines of
 * markup reading only `--ik-*`; splitting them into four modules would make the
 * imports longer than the components.
 */

/* ── The line ladder ──────────────────────────────────────────────────────
 * The first rule, and the one the whole complaint reduces to.
 *
 * Measured: the shipped casefile paints EIGHT gold structure lines at alpha
 * .12–.24 against a frame whose own rail track is 2px of dawn at .55 — a hue
 * swap AND a four-times alpha gap between a panel and the thing it belongs to.
 * Both references draw every structural line at ONE weight in ONE neutral hue
 * and let alpha do the ranking.
 *
 * So the ladder has three rungs, one role each, and gold is not on it. The
 * HUD's own ticks sit beneath them, because the question is never "is this line
 * nice" but "is it the line the frame already draws".
 */
const RUNGS = [
  {
    k: "datum",
    v: "2px · dawn .55",
    note: "the frame's own track; the band an instrument hangs from",
  },
  {
    k: "seam",
    v: "1px · dawn .28",
    note: "between regions — head to record, record to field, key to key",
  },
  { k: "rule", v: "1px · dawn .12", note: "inside one region — a row from the row below it" },
];

export function LineLadder() {
  return (
    <div className="ik-lines">
      {RUNGS.map((r) => (
        <div className="ik-lines__row" key={r.k}>
          <span className="ik-lines__k">{r.k}</span>
          <i className={`ik-lines__bar ik-lines__bar--${r.k}`} aria-hidden="true" />
          <span className="ik-lines__v">{r.v}</span>
          <span className="ik-lines__note">{r.note}</span>
        </div>
      ))}
      <div className="ik-lines__row" data-ref="">
        <span className="ik-lines__k">frame</span>
        <span className="ik-lines__ticks" aria-hidden="true">
          <i data-t="minor" />
          <i data-t="minor" />
          <i data-t="major" />
          <i data-t="minor" />
          <i data-t="minor" />
          <i data-t="major" />
        </span>
        <span className="ik-lines__v">7px / 21px</span>
        <span className="ik-lines__note">
          the rail&apos;s own ticks, for comparison — not a rung
        </span>
      </div>
    </div>
  );
}

/* ── The type ladder ──────────────────────────────────────────────────────
 * One modular scale, two faces, and the three counts that separate this
 * surface from the references.
 *
 * The scale is production's own (`--fl-t0` × 1.2) and does not move. What moves
 * is WEIGHT, TRACKING and CASE — the three things measured to be out of hand:
 * fifteen letter-spacings on one panel against four in a whole reference
 * system, six sites at 700 against a ceiling of 500, and nearly everything
 * uppercase so case ranks nothing.
 *
 * Each row prints its own RESOLVED size, written by the sheet after layout: a
 * ladder that says "chrome-lg" rather than "13.2px" cannot be argued with.
 */
const TYPE_ROWS = [
  { role: "display", face: "sans", token: "display", sample: "Intelligence map" },
  { role: "title", face: "sans", token: "title", sample: "A versioned filesystem" },
  { role: "claim", face: "mono", token: "chrome-lg", sample: "Every stream on one board" },
  { role: "row", face: "mono", token: "chrome-lg", sample: "01_INTELLIGENCE-MAP/" },
  {
    role: "copy",
    face: "sans",
    token: "copy",
    sample: "Twenty-seven modules, including the work deliberately left person-led.",
  },
  { role: "meta", face: "mono", token: "chrome-md", sample: "27 → 47" },
  { role: "eyebrow", face: "mono", token: "chrome-sm", sample: "DIRECTORY · /LOOP-EARPLUGS/" },
];

export function TypeLadder() {
  return (
    <div className="ik-type">
      {TYPE_ROWS.map((r) => (
        <div className="ik-type__row" key={r.role} data-face={r.face} data-role={r.role}>
          <span className="ik-type__k">{r.role}</span>
          <span className="ik-type__spec">
            {r.face} · {r.token}
          </span>
          <span className="ik-type__sample">{r.sample}</span>
          <span className="ik-type__px" data-ik-px="" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

/* ── The marks ────────────────────────────────────────────────────────────
 * A diamond, a reticle, a tick. The house replaces every circle with a 45°
 * square; the reticle registers a composition without closing it into a box;
 * the tick belongs to the rail. All three are already drawn on the surface —
 * the specimen exists so their sizes and alphas can be compared side by side
 * rather than one panel apart.
 */
export function Marks() {
  return (
    <div className="ik-marks">
      <div className="ik-marks__cell">
        <span className="ik-marks__set">
          <i className="ik-diamond" data-size="6" aria-hidden="true" />
          <i className="ik-diamond" data-size="8" aria-hidden="true" />
          <i className="ik-diamond" data-size="12" aria-hidden="true" />
          <i className="ik-diamond" data-tone="dim" data-size="8" aria-hidden="true" />
          <i className="ik-diamond" data-tone="ink" data-size="8" aria-hidden="true" />
        </span>
        <span className="ik-marks__note">diamond · 6 / 8 / 12 · gold, dim, ink</span>
      </div>

      <div className="ik-marks__cell">
        <span className="ik-marks__reticle" aria-hidden="true">
          <i className="ik-ret" data-c="tr" />
          <i className="ik-ret" data-c="bl" />
        </span>
        <span className="ik-marks__note">reticle · the lawful diagonal, TR + BL</span>
      </div>

      <div className="ik-marks__cell">
        <span className="ik-marks__ticks" aria-hidden="true">
          <i data-t="minor" />
          <i data-t="minor" />
          <i data-t="major" />
          <i data-t="minor" />
        </span>
        <span className="ik-marks__note">tick · minor 7px, major 21px</span>
      </div>
    </div>
  );
}

/* ── The label grammar ────────────────────────────────────────────────────
 * Five forms, and no sixth.
 *
 * Both references label heavily and never look busy, because every label is one
 * of a handful of forms with one rung and one alpha each. This surface has the
 * forms already — the designation, the count, the class line — but gives them
 * one register, so they read as a single long undifferentiated caption.
 *
 * ⚠ THE BRACKET HOLDS A DESIGNATION, NEVER AN ORDINAL. ADR-066 removed every
 * ordinal from the casefile: the spine carries order positionally, and a number
 * in a bracket is an ordinal in costume.
 */
export function LabelGrammar() {
  return (
    <div className="ik-labels">
      <div className="ik-labels__cell">
        <span className="ik-lbl" data-form="eyebrow">
          <i className="ik-diamond" data-size="6" aria-hidden="true" />
          TL FS · MOUNT · AUTOSAVE
        </span>
        <span className="ik-labels__note">eyebrow — a mark, then keys on one rung</span>
      </div>

      <div className="ik-labels__cell">
        <span className="ik-lbl" data-form="bracket">
          [ FIELD · ORCHESTRATE ]
        </span>
        <span className="ik-labels__note">bracket — a designation, never an ordinal</span>
      </div>

      <div className="ik-labels__cell">
        <span className="ik-lbl" data-form="kv">
          <span className="ik-lbl__k">METHOD</span>
          <span className="ik-lbl__v">FIO · SQLITE · P50</span>
        </span>
        <span className="ik-labels__note">
          corner key/value — dim key, lit value, right-aligned
        </span>
      </div>

      <div className="ik-labels__cell">
        <span className="ik-lbl" data-form="status" data-on="">
          <i className="ik-diamond" data-size="6" aria-hidden="true" />
          RUNNING
        </span>
        <span className="ik-labels__note">status — a diamond, never a circle</span>
      </div>

      <div className="ik-labels__cell">
        <span className="ik-lbl" data-form="count">
          4 ITEMS
        </span>
        <span className="ik-labels__note">count — right-anchored, the row&apos;s own figure</span>
      </div>
    </div>
  );
}

import { LADDER, RUNGS } from "./data";
import { at, Fig, notched, type Box } from "./fig";

/**
 * L2 · The ladder. The work from upstream to downstream, one rung a row,
 * read at three moments (Arrakis's hierarchy stack, drawn as a table that
 * shares its edges). Adoption: the team does it, with Claude. Encoding:
 * what works is written down. Automation: an agent runs the lower rungs
 * against the evals, and the team's own rows are the upper ones. Nothing
 * is a wheel: the team climbs.
 */
export const L2_BOX: Box = { W: 1000, H: 450 };
const B = L2_BOX;
const AXIS = 236;
const COLW = (B.W - AXIS) / 3;
const HEAD = 78;
const ROWH = 66;
const FOOT = HEAD + ROWH * RUNGS.length;

const GLYPH: Record<string, string> = {
  t: "xc-g xc-g--team",
  c: "xc-g xc-g--claude",
  w: "xc-g xc-g--written",
  a: "xc-g xc-g--agent",
};

export function LayerLadder() {
  return (
    <Fig
      box={B}
      className="xc-board"
      label="The work from deciding what to test down to naming and filing, in three phases: the team does it with Claude, what works is written down, an agent runs the lower rungs and the team keeps the upper ones."
      svg={
        <>
          <path className="xc-housing" d={notched(0.5, 0.5, B.W - 1, B.H - 1, 16)} />
          {[0, 1, 2].map((k) => (
            <line
              key={k}
              className="xc-rule"
              x1={AXIS + COLW * k}
              y1={1}
              x2={AXIS + COLW * k}
              y2={FOOT}
            />
          ))}
          <line className="xc-rule" x1={1} y1={HEAD} x2={B.W - 1} y2={HEAD} />
          {RUNGS.slice(1).map((_, i) => (
            <line
              key={i}
              className="xc-grid"
              x1={1}
              y1={HEAD + ROWH * (i + 1)}
              x2={B.W - 1}
              y2={HEAD + ROWH * (i + 1)}
            />
          ))}
          <line className="xc-rule" x1={1} y1={FOOT} x2={B.W - 1} y2={FOOT} />
          {/* the team's own rows, per phase: a dawn wash under the cells it does by hand */}
          {LADDER.map((p, k) =>
            p.cells.map(([g], r) =>
              g === "t" || g === "c" ? (
                <rect
                  key={`${k}-${r}`}
                  className="xc-wash"
                  x={AXIS + COLW * k + 1}
                  y={HEAD + ROWH * r + 1}
                  width={COLW - 2}
                  height={ROWH - 2}
                />
              ) : null
            )
          )}
          {/* the upstream axis */}
          <path className="xc-trace" d={`M24 ${HEAD + 18} V${FOOT - 18}`} />
          <path className="xc-axishead" d={`M18 ${HEAD + 26} L24 ${HEAD + 14} L30 ${HEAD + 26}`} />
        </>
      }
    >
      {LADDER.map((p, k) => (
        <div
          key={p.n}
          className="xc-colhead"
          style={at(B, AXIS + COLW * k + 22, 0, COLW - 44, HEAD)}
        >
          <span className="xc-cellhead">
            <span className="xc-cellhead__n">{p.n}</span>
            {p.when}
          </span>
          <span className="xc-colhead__t">{p.name}</span>
        </div>
      ))}
      <div className="xc-colhead" style={at(B, 22, 0, AXIS - 44, HEAD)}>
        <span className="xc-cellhead">Upstream</span>
        <span className="xc-colhead__t xc-colhead__t--dim">The work</span>
      </div>
      {RUNGS.map((r, i) => (
        <span key={r.id} className="xc-rung" style={at(B, 44, HEAD + ROWH * i, AXIS - 60, ROWH)}>
          {r.name}
        </span>
      ))}
      {LADDER.map((p, k) =>
        p.cells.map(([g, t], r) => (
          <span
            key={`${k}-${r}`}
            className="xc-cell"
            data-g={g}
            style={at(B, AXIS + COLW * k + 22, HEAD + ROWH * r, COLW - 40, ROWH)}
          >
            <i className={GLYPH[g]} aria-hidden="true" />
            {t}
          </span>
        ))
      )}
      <ul className="xc-key" style={at(B, 24, FOOT, B.W - 48, B.H - FOOT)}>
        <li>
          <i className="xc-g xc-g--team" aria-hidden="true" />
          The team, by hand
        </li>
        <li>
          <i className="xc-g xc-g--claude" aria-hidden="true" />
          The team, with Claude
        </li>
        <li>
          <i className="xc-g xc-g--written" aria-hidden="true" />
          Written down in the layer
        </li>
        <li>
          <i className="xc-g xc-g--agent" aria-hidden="true" />
          An agent runs it, against the evals
        </li>
      </ul>
    </Fig>
  );
}

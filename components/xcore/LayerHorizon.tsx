import { HORIZON, HORIZON_LEVELS, TEAM_TIME } from "./data";
import { at, Fig, notched, type Box } from "./fig";

/**
 * L1 · The horizon. One drawing, two tracks, one clock. Above: how long
 * Claude runs on its own, a gold step that only rises, each step a thing
 * the team wrote down (Tensorlake's stepped line on a grid). Below, on the
 * same columns: where the team's week goes, from making the ads to
 * deciding what to test. The longer Claude runs, the further upstream the
 * team works; the list on the right says what made each step possible.
 */
export const L1_BOX: Box = { W: 1000, H: 450 };
const B = L1_BOX;
const SPLIT = 620;
const PLOT = { x0: 126, x1: 596, y: [262, 202, 142, 82] } as const;
const COLS = [196, 316, 436, 556] as const;
const TRACK = { y: 330, h: 66, w: 30 } as const;
const ROW = { y0: 58, h: 92 } as const;

export function LayerHorizon() {
  const pts: [number, number][] = [[PLOT.x0, PLOT.y[0]]];
  HORIZON.forEach((s, i) => {
    const y = PLOT.y[s.level];
    if (i > 0) pts.push([COLS[i], pts[pts.length - 1][1]]);
    pts.push([COLS[i], y]);
  });
  pts.push([PLOT.x1, PLOT.y[3]]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const fills = ["xc-seg xc-seg--make", "xc-seg xc-seg--check", "xc-seg xc-seg--decide"];

  return (
    <Fig
      box={B}
      className="xc-board"
      label="How long Claude runs on its own rises in four steps, from minutes to a week, each one a thing the team wrote down; the team's week moves from making the ads to deciding what to test."
      svg={
        <>
          <path className="xc-housing" d={notched(0.5, 0.5, B.W - 1, B.H - 1, 16)} />
          <line className="xc-rule" x1={SPLIT} y1={1} x2={SPLIT} y2={B.H - 1} />
          <line className="xc-rule" x1={1} y1={306} x2={SPLIT} y2={306} />
          {/* the datum */}
          {PLOT.y.map((y) => (
            <line key={y} className="xc-grid" x1={PLOT.x0} y1={y} x2={PLOT.x1} y2={y} />
          ))}
          {COLS.map((x) => (
            <line key={x} className="xc-grid" x1={x} y1={60} x2={x} y2={TRACK.y + TRACK.h} />
          ))}
          <path className="xc-stepline" d={line} />
          {HORIZON.map((s, i) => (
            <rect
              key={s.n}
              className="xc-stepmark"
              x={COLS[i] - 6}
              y={PLOT.y[s.level] - 6}
              width={12}
              height={12}
            />
          ))}
          {/* the team's week, same columns */}
          {HORIZON.map((s, i) => {
            let y = TRACK.y + TRACK.h;
            return (
              <g key={s.n}>
                {s.team.map((v, k) => {
                  const h = (v / 100) * TRACK.h;
                  y -= h;
                  return (
                    <rect
                      key={k}
                      className={fills[k]}
                      x={COLS[i] - TRACK.w / 2}
                      y={y}
                      width={TRACK.w}
                      height={h}
                    />
                  );
                })}
              </g>
            );
          })}
          {HORIZON.slice(1).map((_, i) => (
            <line
              key={i}
              className="xc-rule"
              x1={SPLIT}
              y1={ROW.y0 + ROW.h * (i + 1)}
              x2={B.W - 1}
              y2={ROW.y0 + ROW.h * (i + 1)}
            />
          ))}
        </>
      }
    >
      <p className="xc-cellhead" style={at(B, 24, 20)}>
        <span className="xc-cellhead__n">A</span>How long Claude runs on its own
      </p>
      <p className="xc-cellhead xc-cellhead--r" style={at(B, SPLIT - 200, 20, 176)}>
        Illustrative
      </p>
      <p className="xc-cellhead" style={at(B, SPLIT + 24, 20)}>
        <span className="xc-cellhead__n">B</span>What the team wrote down
      </p>
      {HORIZON_LEVELS.map((l, i) => (
        <span key={l} className="xc-axis xc-axis--y" style={at(B, 24, PLOT.y[i] - 9, 90)}>
          {l}
        </span>
      ))}
      {HORIZON.map((s, i) => (
        <span key={s.n} className="xc-axis xc-axis--x" style={at(B, COLS[i] - 50, 274, 100)}>
          {s.when}
        </span>
      ))}
      {HORIZON.map((s, i) => (
        <span key={s.n} className="xc-steptag" style={at(B, COLS[i] + 12, PLOT.y[s.level] - 26)}>
          {s.n}
        </span>
      ))}
      <p className="xc-cellhead" style={at(B, 24, 318)}>
        <span className="xc-cellhead__n">C</span>The team&apos;s week
      </p>
      <ul className="xc-legend" style={at(B, 24, 344, 120)}>
        {[...TEAM_TIME].reverse().map((t, k) => (
          <li key={t} data-k={2 - k}>
            {t}
          </li>
        ))}
      </ul>
      {HORIZON.map((s, i) => (
        <div
          key={s.n}
          className="xc-wrote"
          style={at(B, SPLIT + 24, ROW.y0 + ROW.h * i, B.W - SPLIT - 48, ROW.h)}
        >
          <span className="xc-wrote__n">
            {s.n}
            <span>{s.when}</span>
          </span>
          <span className="xc-wrote__t">{s.wrote}</span>
          <span className="xc-wrote__l">{s.runs}</span>
        </div>
      ))}
    </Fig>
  );
}

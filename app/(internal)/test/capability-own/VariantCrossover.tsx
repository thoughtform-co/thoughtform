"use client";

/* C · THE CROSSOVER. The simplest reading of "self-sufficient" a board can
   take in at a glance: Thoughtform's time goes down while what the team
   runs on its own goes up, and where they cross is the point of the month.

     · gold, left scale: Thoughtform's days a week, the proposal's own (five
       on site, then three a week remote, about fourteen; none after), each
       week a column of dots, a row of dots a day;
     · green, right scale: the workstreams an owner in the team runs, the
       four weeks' own "Done when" (none in week one, one by the end of week
       two, two by week three, all four in week four), a stepped trace,
       level and plumb;
     · where the green passes the gold, a target lock: self-sufficient.

   A playhead reads the weeks off the scroll. */

import type { CSSProperties } from "react";

import { held, lerp, PHASES, pathOf, type Pt, seg } from "./model";
import { Fig, Mark, Word } from "./shared";

export const C = {
  x0: 150,
  x1: 1050,
  y0: 70,
  y1: 390,
  /** The left scale's top (days a week) and the right's (workstreams). */
  days: 5,
  streams: 4,
  /** A dot's pitch in a column, and the column's width in dots. */
  pitch: 8,
  cols: 9,
} as const;

const colW = (C.x1 - C.x0) / PHASES.length;
const colX = (i: number) => C.x0 + colW * i;
export const yDays = (d: number) => C.y1 - (d / C.days) * (C.y1 - C.y0);
export const yStreams = (n: number) => C.y1 - (n / C.streams) * (C.y1 - C.y0);

/** What the team runs during a week: what it held at the end of the last. */
const heldIn = (i: number) => (i > 0 ? PHASES[i - 1].owned : 0);

/** The team's trace: level through each week at what it held coming in, a
    plumb riser at the week's end to what it holds going out. */
export const STEPS: Pt[] = (() => {
  const pts: Pt[] = [[C.x0, yStreams(0)]];
  PHASES.forEach((ph, i) => {
    pts.push([colX(i + 1), yStreams(heldIn(i))]);
    if (ph.owned !== heldIn(i)) pts.push([colX(i + 1), yStreams(ph.owned)]);
  });
  return pts;
})();

/** Where the green first rises past the gold: the riser at a week's end
    that crosses the level of Thoughtform's days that week. */
export const CROSS: Pt = (() => {
  for (let i = 0; i < PHASES.length; i++) {
    const gold = yDays(PHASES[i].days);
    if (yStreams(heldIn(i)) > gold && yStreams(PHASES[i].owned) <= gold)
      return [colX(i + 1), gold];
  }
  return [C.x1, C.y0];
})();

/** One week's column of dots: a row a day, all of the week's days. */
function dotsOf(i: number, days: number, grown: number): string {
  const rows = Math.round(((days / C.days) * (C.y1 - C.y0)) / C.pitch);
  const shown = Math.round(rows * grown);
  const mid = colX(i) + colW / 2;
  const left = mid - ((C.cols - 1) * C.pitch) / 2;
  let d = "";
  for (let r = 0; r < shown; r++) {
    const y = C.y1 - C.pitch / 2 - r * C.pitch;
    for (let c = 0; c < C.cols; c++) {
      const x = left + c * C.pitch;
      d += `M${(x - 1.5).toFixed(1)} ${(y - 1.5).toFixed(1)}h3v3h-3z`;
    }
  }
  return d;
}

export function VariantCrossover({ p }: { p: number }) {
  const t = held(p);
  const x = lerp(C.x0, C.x1, t);
  const locked = seg(x, CROSS[0], CROSS[0] + 40);
  const week = Math.min(PHASES.length - 1, Math.floor((x - C.x0) / colW));

  return (
    <Fig
      label="Thoughtform's days a week fall, five on site in week one, three a week remote in weeks two to four, none after, while the workstreams the team runs on its own rise from none to all four; where the two cross, in week four, the team is self-sufficient."
      svg={
        <>
          <defs>
            <clipPath id="co-c-seen">
              <rect x={0} y={0} width={x} height={460} />
            </clipPath>
          </defs>

          {/* the graticule: a level a day on the left scale */}
          {Array.from({ length: C.days + 1 }, (_, d) => (
            <path
              key={d}
              d={`M${C.x0} ${yDays(d)}H${C.x1}`}
              className={d === 0 ? "co-rule" : "co-grid"}
            />
          ))}
          {PHASES.map((_, i) => (
            <path key={i} d={`M${colX(i)} ${C.y0 - 10}V${C.y1 + 8}`} className="co-grid" />
          ))}
          <path d={`M${C.x1} ${C.y0 - 10}V${C.y1 + 8}`} className="co-grid" />
          {/* the two scales' ticks */}
          {Array.from({ length: C.days + 1 }, (_, d) => (
            <path key={d} d={`M${C.x0 - 8} ${yDays(d)}H${C.x0}`} className="co-rule co-rule--gold" />
          ))}
          {Array.from({ length: C.streams + 1 }, (_, n) => (
            <path
              key={n}
              d={`M${C.x1} ${yStreams(n)}H${C.x1 + 8}`}
              className="co-rule co-rule--green"
            />
          ))}

          {/* Thoughtform's days, a column a week, grown as the week is read */}
          {PHASES.map((ph, i) => (
            <path
              key={ph.id}
              d={dotsOf(i, ph.days, seg(x, colX(i), colX(i) + colW * 0.6))}
              className="co-days"
            />
          ))}

          {/* the team's trace */}
          <g clipPath="url(#co-c-seen)">
            <path d={pathOf(STEPS)} className="co-steps" />
            {STEPS.slice(1).map((q, i) =>
              STEPS[i][0] === q[0] ? (
                <rect key={i} x={q[0] - 3} y={q[1] - 3} width={6} height={6} className="co-tap-green" />
              ) : null
            )}
          </g>

          {/* the lock where they cross */}
          <g opacity={locked} className="co-lock">
            {(
              [
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1],
              ] as const
            ).map(([sx, sy]) => {
              const h = 22;
              const arm = 9;
              const cx = CROSS[0] + sx * h;
              const cy = CROSS[1] + sy * h;
              return (
                <path
                  key={`${sx}${sy}`}
                  d={`M${cx - sx * arm} ${cy}H${cx}V${cy - sy * arm}`}
                  className="co-bracket"
                />
              );
            })}
          </g>

          <path d={`M${x.toFixed(1)} ${C.y0 - 14}V${C.y1 + 14}`} className="co-playhead" />
          <Mark c={[C.x0 - 64, C.y0 - 40]} h={14} className="co-mark--gold" />
        </>
      }
    >
      {/* the scales */}
      <Word x={C.x0 - 48} y={C.y0 - 40} className="co-mono co-mono--gold co-tag--l">
        Thoughtform · days a week
      </Word>
      <Word x={C.x1 + 8} y={C.y0 - 40} className="co-mono co-mono--green co-tag--r">
        Workstreams your team runs
      </Word>
      {Array.from({ length: C.days + 1 }, (_, d) => (
        <Word key={d} x={C.x0 - 14} y={yDays(d)} className="co-mono co-tag--r co-num">
          {d}
        </Word>
      ))}
      {Array.from({ length: C.streams + 1 }, (_, n) => (
        <Word key={n} x={C.x1 + 14} y={yStreams(n)} className="co-mono co-tag--l co-num">
          {n}/4
        </Word>
      ))}

      {/* the weeks, and what each costs and leaves */}
      {PHASES.map((ph, i) => (
        <Word
          key={ph.id}
          x={colX(i) + colW / 2}
          y={C.y1 + 26}
          className="co-mono co-tag--c co-week"
          style={{ opacity: i <= week ? 1 : 0.45 } as CSSProperties}
        >
          <b className="co-mono__key">{ph.when}</b>
          {ph.where ? ` · ${ph.where}` : ""}
        </Word>
      ))}
      {PHASES.map((ph, i) => (
        <Word
          key={ph.id}
          x={colX(i) + colW / 2}
          y={yDays(ph.days) - 14}
          className="co-mono co-tag--c co-mono--gold co-tag"
          style={{ opacity: seg(x, colX(i) + colW * 0.6, colX(i) + colW * 0.7) } as CSSProperties}
        >
          {ph.days ? `${ph.days} days` : "Moved on"}
        </Word>
      ))}

      <Word
        x={CROSS[0] + 32}
        y={CROSS[1] - 30}
        className="co-mono co-tag--l co-lock-word"
        style={{ opacity: locked } as CSSProperties}
      >
        Self-sufficient
      </Word>
    </Fig>
  );
}

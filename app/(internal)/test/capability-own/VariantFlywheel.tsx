"use client";

/* B · THE FLYWHEEL. The owner's own line (2026-08-14): "for me, adoption and
   automation, they are the same flywheel." One dial, the About drawing's
   ring register, and a bearing going round three stations on its working
   ring: your team uses it, writes down what works, hands it over. One turn
   hands one workstream over: its line into the dial lights, its chip is
   owned, and the turn leaves a ring inside the dial, so the turns stack up.
   Each turn takes less scroll than the last: it compounds.

   Who turns it is the hub's reading, and Thoughtform's mark leaves the hub
   for the rim, the track, and the frame's edge as the turns pass to the
   team: "I come in, the team takes over, I move on" (about-vince, §XXXVII),
   in the page's third person. */

import type { CSSProperties } from "react";

import { DIAL_RINGS, polar, rimTicks, spokes } from "@/components/xb-proposal/kit/dial";

import { ease, held, lerp, pathOf, type Pt, seg, STREAMS } from "./model";
import { Chip, Fig, Mark, Word } from "./shared";

export const B = {
  c: [590, 240] as Pt,
  /** The rim's radius, and the working ring the bearing rides. */
  r: 184,
  rw: 120,
  hub: 62,
  chipsY: [150, 210, 270, 330] as const,
  /** The three stations, on the working ring, clockwise from east. */
  stations: [
    { deg: 0, key: "Use it", line: "Your team, on its own work", tone: "green" },
    { deg: 120, key: "Write it down", line: "What works, as a skill", tone: "gold" },
    { deg: 240, key: "Hand it over", line: "Claude runs it, an owner checks", tone: "dawn" },
  ] as const,
  /** Each turn's share of the runway: shorter every turn. */
  turns: [0.33, 0.26, 0.22, 0.19] as const,
  /** Thoughtform's way out: the hub, the rim at 45 degrees, the track, out. */
  out: [
    [590, 240],
    [720, 110],
    [1230, 110],
  ] as Pt[],
  /** Where the mark stands through each turn, along `out`: the hub, the
      rim, the track, gone. */
  seats: [
    [590, 240],
    [720, 110],
    [990, 110],
    [1230, 110],
  ] as Pt[],
} as const;

/** Who turns the wheel, turn by turn. */
const DRIVERS = [
  { who: "Thoughtform turns it", when: "Week 1 · on site" },
  { who: "Turned together", when: "Weeks 2–3 · remote" },
  { who: "Your team turns it", when: "Week 4 · remote" },
  { who: "It turns on its own", when: "After" },
] as const;

/** The level line from a chip's edge to the rim. */
export function chipLine(y: number): Pt[] {
  const [cx, cy] = B.c;
  const dx = Math.sqrt(B.r * B.r - (y - cy) * (y - cy));
  return [
    [212, y],
    [cx - dx, y],
  ];
}

/** The turn the runway's clock is in, and how far through it. */
export function turnAt(t: number): { k: number; f: number } {
  let acc = 0;
  for (let k = 0; k < B.turns.length; k++) {
    const w = B.turns[k];
    if (t < acc + w || k === B.turns.length - 1) return { k, f: seg(t, acc, acc + w) };
    acc += w;
  }
  return { k: B.turns.length - 1, f: 1 };
}

/** An arc on a ring, clockwise from `a0` to `a1` degrees. */
function arc(c: Pt, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= 359.99) {
    const [x0, y0] = polar(c, r, a0);
    const [xm, ym] = polar(c, r, a0 + 180);
    return `M${x0} ${y0}A${r} ${r} 0 1 1 ${xm} ${ym}A${r} ${r} 0 1 1 ${x0} ${y0}`;
  }
  const [x0, y0] = polar(c, r, a0);
  const [x1, y1] = polar(c, r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** The point `s` of the way along a polyline, by length. */
function along(pts: readonly Pt[], s: number): Pt {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = s * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const u = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
const lenOf = (pts: readonly Pt[]) =>
  pts.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
/** How far along `out` a seat is, 0..1. */
const sOf = (q: Pt) => {
  const total = lenOf(B.out);
  const first = lenOf(B.out.slice(0, 2));
  if (q[1] < B.c[1] - 1) return (first + (q[0] - B.out[1][0])) / total;
  return 0;
};

export function VariantFlywheel({ p }: { p: number }) {
  const t = held(p, 0.05, 0.07);
  const { k, f } = turnAt(t);
  const done = t >= 1 ? 4 : k;
  const deg = B.stations[0].deg + 360 * f;
  const c = B.c;
  /* the mark holds the hub through the first turn, and steps out at the
     start of each turn after: to the rim, the track, off the frame */
  const from = sOf(B.seats[Math.max(0, k - 1)]);
  const to = sOf(B.seats[k]);
  const s = t >= 1 ? 1 : lerp(from, to, ease(seg(f, 0, 0.4)));
  const mark = along(B.out, s);
  const markGone = seg(s, 0.9, 1);
  const atHub = s < 0.02;
  const team = k >= 2 || (k === 1 && f > 0.5);
  const drive = DRIVERS[Math.min(done, 3)];

  return (
    <Fig
      label="A dial: a bearing goes round three stations, use it, write it down, hand it over. Each turn hands one of the four workstreams over and leaves a ring inside the dial. Thoughtform turns the first, the team the last, and Thoughtform's mark leaves the hub, then the dial, then the frame."
      svg={
        <>
          {/* the ring register */}
          {DIAL_RINGS.map((ring) => (
            <circle
              key={ring.r}
              cx={c[0]}
              cy={c[1]}
              r={ring.r * B.r}
              className={`co-ring co-ring--${ring.tone}`}
              style={{ strokeOpacity: ring.a, strokeDasharray: ring.dash } as CSSProperties}
            />
          ))}
          {rimTicks(c, B.r, 6, 15).map(([a, b], i) => (
            <path key={i} d={pathOf([a, b])} className="co-rule co-rule--faint" />
          ))}
          {spokes(c, B.hub + 8, B.rw - 10).map(([a, b], i) => (
            <path key={i} d={pathOf([a, b])} className="co-rule co-rule--faint" />
          ))}
          {/* the working ring */}
          <circle cx={c[0]} cy={c[1]} r={B.rw} className="co-ring co-ring--work" />

          {/* each turn done leaves a ring: they stack up */}
          {[0, 1, 2, 3].map((i) =>
            i < done ? (
              <circle
                key={i}
                cx={c[0]}
                cy={c[1]}
                r={B.hub + 10 + i * 9}
                className="co-ring co-ring--turned"
              />
            ) : null
          )}

          {/* the workstreams' lines into the dial: lit once handed over */}
          {B.chipsY.map((y, i) => (
            <path
              key={y}
              d={pathOf(chipLine(y))}
              className={i < done ? "co-lane co-lane--owned" : "co-lane co-lane--learning"}
            />
          ))}

          {/* the stations and their leaders out of the dial */}
          {B.stations.map((st) => {
            const at = polar(c, B.rw, st.deg);
            const rim = polar(c, B.r, st.deg);
            const lead: Pt[] =
              st.deg === 0
                ? [rim, [rim[0] + 34, rim[1]]]
                : [rim, [rim[0], rim[1] + (st.deg === 120 ? 30 : -30)]];
            return (
              <g key={st.deg}>
                <path d={pathOf([at, rim])} className="co-rule" />
                <path d={pathOf(lead)} className="co-rule" />
                <path
                  d={`M${at[0]} ${at[1] - 6}L${at[0] + 6} ${at[1]}L${at[0]} ${at[1] + 6}L${at[0] - 6} ${at[1]}Z`}
                  className={`co-station co-station--${st.tone}`}
                />
              </g>
            );
          })}

          {/* the turn under way, and its bearing */}
          {t < 1 && (
            <path
              d={arc(c, B.rw, B.stations[0].deg, deg)}
              className={team ? "co-sweep co-sweep--team" : "co-sweep"}
            />
          )}
          {t < 1 &&
            (() => {
              const [bx, by] = polar(c, B.rw, deg);
              return (
                <rect
                  x={bx - 4.5}
                  y={by - 4.5}
                  width={9}
                  height={9}
                  transform={`rotate(45 ${bx} ${by})`}
                  className={team ? "co-bearing co-bearing--team" : "co-bearing"}
                />
              );
            })()}

          {/* the hub */}
          <circle cx={c[0]} cy={c[1]} r={B.hub} className="co-hub" />

          {/* Thoughtform's way out */}
          <path d={pathOf(B.out)} className="co-gold co-gold--track" />
          {B.seats.slice(1, 3).map((q) => (
            <path key={q[0]} d={`M${q[0]} ${q[1] - 7}V${q[1] + 7}`} className="co-rule" />
          ))}
          <Mark
            c={mark}
            h={atHub ? 22 : 16}
            opacity={1 - markGone}
            className="co-mark--gold"
          />
        </>
      }
    >
      {STREAMS.map((st, i) => (
        <Chip key={st.id} id={st.id} name={st.name} x={12} y={B.chipsY[i]} owned={i < done} />
      ))}

      {B.stations.map((st) => {
        const rim = polar(c, B.r, st.deg);
        const seat: Pt =
          st.deg === 0
            ? [rim[0] + 42, rim[1]]
            : [rim[0], rim[1] + (st.deg === 120 ? 44 : -44)];
        return (
          <Word
            key={st.deg}
            x={seat[0]}
            y={seat[1]}
            className={`co-station-word${st.deg === 0 ? " co-tag--l" : " co-tag--c"}`}
            style={{ "--tone-k": `var(--co-${st.tone})` } as CSSProperties}
          >
            <b className="co-mono">{st.key}</b>
            <span>{st.line}</span>
          </Word>
        );
      })}

      {/* the hub's reading: who turns it */}
      <Word x={c[0]} y={c[1] + (atHub ? 28 : 0)} className="co-hub-word co-tag--c">
        <b className="co-mono">Turn {Math.min(done + 1, 4)} of 4</b>
        <span data-team={team ? "" : undefined}>{drive.who}</span>
      </Word>

      {/* the track's stations: on site at the hub, then remote, then gone */}
      <Word x={B.seats[1][0] + 12} y={B.seats[1][1] - 18} className="co-mono co-tag co-tag--l">
        Together · remote
      </Word>
      <Word x={B.seats[2][0]} y={B.seats[2][1] - 18} className="co-mono co-tag co-tag--c">
        Your team leads
      </Word>
      <Word
        x={1188}
        y={B.seats[2][1] + 20}
        className="co-mono co-tag co-tag--r co-mono--gold"
        style={{ opacity: markGone } as CSSProperties}
      >
        Thoughtform moves on
      </Word>
      <Word x={1188} y={440} className="co-mono co-tag co-tag--r">
        {drive.when}
      </Word>
    </Fig>
  );
}

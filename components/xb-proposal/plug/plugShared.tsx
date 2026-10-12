"use client";

/* What the three directions share with production: the same chips, the same
   tags, the same cards, the same mark, in production's own markup and
   classes (`plug.css`), read from `PlugFlow`'s records by reference. A
   direction changes the LINES and the seats; the words stay one record. */

import type { CSSProperties } from "react";

import { BRANDMARK_PATHS } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH } from "../glyphs";
import { pathOf, type Pt } from "../kit/trace";

import { at, CARDS, ICON, Icon, PARTS, TEAMS, W } from "./PlugFlow";

export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export const FIG_LABEL =
  "Your team feeds one intelligence layer, which runs in Claude Enterprise and shows up in your tools";

/** A straight line that draws on at arrival. No `vector-effect`: a draw-on
    run reads `pathLength`, which a non-scaling stroke ignores. */
export function Draw({ pts, className, d }: { pts: readonly Pt[]; className: string; d: number }) {
  return (
    <path d={pathOf(pts)} className={`${className} pl-draw`} style={delay(d)} pathLength={1} />
  );
}

/** One ring of an instrument. */
export function Ring({
  c,
  r,
  tone = "dawn",
  a,
  dash,
}: {
  c: Pt;
  r: number;
  tone?: "dawn" | "gold";
  a: number;
  dash?: string;
}) {
  return (
    <circle
      cx={c[0]}
      cy={c[1]}
      r={r}
      className="kit-ring"
      data-tone={tone}
      strokeOpacity={a}
      strokeDasharray={dash}
    />
  );
}

/** Short static marks (ticks, stubs, spokes) as one path. */
export function Marks({
  segs,
  className,
}: {
  segs: readonly (readonly [Pt, Pt])[];
  className: string;
}) {
  return <path d={segs.map((s) => pathOf(s)).join("")} className={className} />;
}

/** The brandmark, its top-left at `(x, y)`, scaled by `k`. */
export function Mark({ x, y, k }: { x: number; y: number; k: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} className="pl-mark">
      {BRANDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** The four workstreams, each chip's LEFT edge at its seat. */
export function Chips({ seats }: { seats: readonly { x: number; y: number }[] }) {
  return (
    <>
      {TEAMS.map((t, i) => (
        <div
          key={t.id}
          className="pl-chip pl-in"
          style={{ ...at(seats[i].x, seats[i].y), ...delay(80 + i * 70) }}
        >
          <svg viewBox="0 0 24 24" className="pl-ico pl-ico--team" aria-hidden>
            <path d={GLYPH[t.id]} />
          </svg>
          <span>{t.name}</span>
        </div>
      ))}
    </>
  );
}

/** Context, Skills, Evals: a tag centred on each seat. */
export function PartTags({ seats }: { seats: readonly Pt[] }) {
  return (
    <>
      {PARTS.map((p, i) => (
        <div
          key={p.name}
          className="pl-part pl-in"
          style={{ ...at(seats[i][0], seats[i][1]), ...delay(900 + i * 90) }}
        >
          {p.name}
        </div>
      ))}
    </>
  );
}

/** Production's cards, one per row. */
export function Cards({ x0, x1, rows }: { x0: number; x1: number; rows: readonly number[] }) {
  return (
    <>
      {CARDS.map((c, i) => (
        <div
          key={c.tool}
          className="pl-card pl-in"
          data-lit={c.lit ? "" : undefined}
          style={
            {
              ...at(x0, rows[i]),
              "--w": ((x1 - x0) / W).toFixed(4),
              ...delay(1500 + i * 90),
            } as CSSProperties
          }
        >
          <span className="pl-card__ico">
            <Icon d={ICON[c.icon]} />
          </span>
          <span className="pl-card__body">
            <span className="pl-card__title">
              {c.title}
              <em>{c.time}</em>
            </span>
            <span className="pl-card__sub">
              {c.tool} · {c.sub}
            </span>
          </span>
        </div>
      ))}
    </>
  );
}

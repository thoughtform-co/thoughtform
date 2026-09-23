"use client";

import { useRef, type CSSProperties } from "react";

import type { MusingBeat } from "@/lib/musings/cover";
import { atOnWindow, axisWindow } from "@/lib/sheet/axis";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  ReadButton,
  Readout,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
  type GalleryPost,
} from "./kit";

/**
 * v2 · STARMAP — the Arc, plotted.
 *
 * Built from: Starfield's star map (Starfield-2 — a readout panel beside a
 * chart, the selected body tagged where it sits), the amber terminal
 * instruments (ig_DFJPbFATvER — a graticule, ticks, lettered waypoints, a
 * dotted route), and this house's program board (ADR-078 — a dated axis on
 * which "the gaps are the reading").
 *
 * The site says you travel latent space and the story; this is the one
 * direction that draws the travelling. Every note is a waypoint at the day it
 * was filed, in the lane of its Arc beat — Navigate, Encode, Build — and one
 * dotted route runs through them in the order they were written. Nothing is
 * placed by hand: x is the filing date, y is the tag. The selected waypoint
 * drops a line to its date on the axis, and the readout under the chart is
 * that note.
 */

const LANES: readonly MusingBeat[] = ["navigate", "encode", "build"];
/** The house's own axis (ADR-118): weeks while the record fits in sixteen,
 *  then months, then quarters; the division holding today gives its label to
 *  NOW. Positions are fractions of the window, at the middle of each day. */
function windowOf(posts: readonly GalleryPost[], today: string) {
  const dates = posts.map((p) => p.date).sort();
  const first = dates[0] ?? today;
  const last = [dates[dates.length - 1] ?? today, today].sort()[1];
  const w = axisWindow(first, last);
  return {
    at: (iso: string) => atOnWindow(w, iso) * 100,
    months: w.ticks.map((t, k) => ({ key: `${k}-${t.label}`, label: t.label, x: t.at * 100 })),
  };
}

export function Starmap({ posts, today }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);

  const { at, months } = windowOf(posts, today);
  const laneOf = (p: GalleryPost) => Math.max(0, LANES.indexOf(beatOfPost(p) ?? "navigate"));
  const yOf = (lane: number) => ((lane + 0.5) / LANES.length) * 100;
  const pts = posts.map((p) => ({ p, x: at(p.date), y: yOf(laneOf(p)), lane: laneOf(p) }));
  /* A label hangs right of its mark, and left once the mark is past 70 % — and
     flips ABOVE the lane's centre when a neighbour in the same lane sits
     within 16 % of it, so two notes filed a week apart never letter through
     each other. */
  const byLane = LANES.map((_, l) => pts.filter((q) => q.lane === l).sort((a, b) => a.x - b.x));
  const lift = new Map<string, boolean>();
  for (const lane of byLane)
    lane.forEach((q, i) => {
      const prev = lane[i - 1];
      lift.set(q.p.slug, !!prev && q.x - prev.x < 16 && !lift.get(prev.p.slug));
    });
  const route = [...pts].sort((a, b) => a.p.date.localeCompare(b.p.date));
  const now = at(today);

  return (
    <div className="mg mg--starmap" data-mg-root="" data-mg-v="v2" ref={ref}>
      <section className="mg-plate mg-sm__chart" aria-label="Musings, plotted by date and beat">
        <header className="mg-band">
          <span className="mg-band__kick">The Arc</span>
          <span className="mg-band__meta">{posts.length} notes</span>
        </header>
        <div className="mg-sm__field">
          <ol className="mg-sm__lanes" aria-hidden="true">
            {LANES.map((b) => (
              <li key={b} className="mg-sm__lane">
                <BeatGlyph beat={b} className="mg-sm__lane-glyph" />
                {BEAT_NAME[b]}
              </li>
            ))}
          </ol>
          <div className="mg-sm__plot">
            {months.map((m) => (
              <span key={m.key} className="mg-sm__grid" style={{ left: `${m.x}%` }} />
            ))}
            <svg
              className="mg-sm__route"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <polyline points={route.map((q) => `${q.x},${q.y}`).join(" ")} />
            </svg>
            <span className="mg-sm__now" style={{ left: `${now}%` }}>
              <span className="mg-sm__now-tag">Now</span>
            </span>
            {pts.map(({ p, x, y }, i) => (
              <span
                key={`drop-${p.slug}`}
                className="mg-sm__drop"
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-hidden="true"
              />
            ))}
            {pts.map(({ p, x, y }, i) => (
              <a
                key={p.slug}
                className="mg-sm__pt"
                href={postHref(p.slug)}
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
                data-flip={x > 70 ? "" : undefined}
                data-lift={lift.get(p.slug) ? "" : undefined}
                style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties}
              >
                <span className="mg-sm__mark" aria-hidden="true" />
                <span className="mg-sm__label">{p.title}</span>
              </a>
            ))}
          </div>
          <div className="mg-sm__axis" aria-hidden="true">
            {months.map((m) => (
              <span key={m.key} className="mg-sm__month" style={{ left: `${m.x}%` }}>
                {m.label}
              </span>
            ))}
            {pts.map(({ p, x }, i) => (
              <span
                key={`tick-${p.slug}`}
                className="mg-sm__tick"
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
                style={{ left: `${x}%` }}
              >
                {filed(p).replace(/ \d{4}$/, "")}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mg-sm__readouts">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <article
              key={p.slug}
              className="mg-plate mg-sm__readout"
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
              aria-label={p.title}
            >
              <div className="mg-sm__text">
                <span className="mg-sm__kick">
                  {beat ? BEAT_NAME[beat] : "Practice"} · Filed {filed(p)}
                </span>
                <h3 className="mg-sm__name">{p.title}</h3>
                <p className="mg-sm__summary">{p.summary}</p>
              </div>
              <Readout post={p} className="mg-sm__rows" />
              <div className="mg-sm__go">
                <ReadButton post={p} />
                <AllMusings className="mg-sm__all" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

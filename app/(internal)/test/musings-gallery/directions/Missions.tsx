"use client";

import { useRef } from "react";

import type { MusingBeat } from "@/lib/musings/cover";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  Byline,
  Meta,
  ReadButton,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
  type GalleryPost,
} from "./kit";

/**
 * v9 · MISSIONS — the notes filed under the Arc.
 *
 * Built from the mission-log angle (Starfield's missions, The Outer Worlds'
 * journal — a list grouped by kind, the tracked entry marked, its brief
 * beside it), on the one thing no other direction draws: the site's own
 * story. The Arc — NAVIGATE · ENCODE · BUILD — is the filing system, and each
 * note sits in its beat's LANE at its date. Three lanes side by side, in the
 * Arc's order, each headed by its glyph and name over a hairline, its notes
 * as stacked entries (stamp · title · meta); a fourth lane, PRACTICE, only if
 * a note carries no beat. Lanes are divided by air, never by a rule.
 *
 * The open entry EXPANDS IN PLACE (the Chapters mechanic: `grid-template-rows`
 * 0fr → 1fr, one transitioned property, the content laid out at its final
 * width) to reveal the summary, the byline and the way in; the lit entry
 * takes the mark and the lip — Starfield's tracked-mission marker. An empty
 * lane letters `NO NOTE YET`: honest, and it shows the owner where the
 * archive is thin. Counts are marks, never digits.
 *
 * ⚠ The risk, named: three columns of cards can read as a kanban board. The
 * defence is the chrome — lane heads as designations, entries as folder
 * plates, no coloured lanes, no digits. If it reads as SaaS, it goes.
 */

const LANES: readonly MusingBeat[] = ["navigate", "encode", "build"];

interface Lane {
  id: MusingBeat | "practice";
  name: string;
  beat: MusingBeat | null;
  entries: GalleryPost[];
}

export function lanesOf(posts: readonly GalleryPost[]): Lane[] {
  const lanes: Lane[] = LANES.map((b) => ({
    id: b,
    name: BEAT_NAME[b],
    beat: b,
    entries: posts.filter((p) => beatOfPost(p) === b),
  }));
  const unfiled = posts.filter((p) => beatOfPost(p) === null);
  if (unfiled.length)
    lanes.push({ id: "practice", name: "Practice", beat: null, entries: unfiled });
  return lanes;
}

export function Missions({ posts }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const lanes = lanesOf(posts);

  return (
    <div
      className="mg mg--missions"
      data-mg-root=""
      data-mg-v="v9"
      style={{ "--mg-lanes": lanes.length } as React.CSSProperties}
      ref={ref}
    >
      <div className="mg-mb__lanes">
        {lanes.map((lane) => (
          <section key={lane.id} className="mg-mb__lane" aria-label={lane.name}>
            <header className="mg-mb__lane-head">
              <BeatGlyph beat={lane.beat} className="mg-mb__lane-glyph" />
              <span className="mg-mb__lane-name">{lane.name}</span>
              <span className="mg-mb__count" aria-hidden="true">
                {lane.entries.map((p) => (
                  <i key={p.slug} />
                ))}
              </span>
            </header>
            <ol className="mg-mb__list" data-mg-keys="">
              {lane.entries.map((p) => {
                const i = posts.indexOf(p);
                return (
                  <li
                    key={p.slug}
                    className="mg-plate mg-mb__entry"
                    data-mg-slug={p.slug}
                    data-mg-on={onAtRest(i)}
                  >
                    <a className="mg-mb__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                      <span className="mg-mb__mark" aria-hidden="true" />
                      <span className="mg-mb__text">
                        <span className="mg-mb__stamp">{filed(p)}</span>
                        <span className="mg-mb__title">{p.title}</span>
                        <Meta post={p} className="mg-mb__meta" />
                      </span>
                    </a>
                    <div className="mg-mb__open">
                      <div className="mg-mb__inner">
                        <p className="mg-mb__summary">{p.summary}</p>
                        <div className="mg-mb__sign">
                          <Byline post={p} className="mg-mb__byline" />
                          <ReadButton post={p} className="mg-mb__read" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {lane.entries.length === 0 ? (
                <li className="mg-mb__empty" aria-hidden="true">
                  No note yet
                </li>
              ) : null}
            </ol>
          </section>
        ))}
      </div>
      <div className="mg-mb__way">
        <AllMusings />
      </div>
    </div>
  );
}

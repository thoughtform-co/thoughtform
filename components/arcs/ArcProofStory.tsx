"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import { ProofCard } from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import {
  PROOF_STACK_CASE,
  proofStackClient,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { getCase } from "@/lib/cases/registry";
import type { CaseTrack } from "@/lib/cases/types";

import { ArcBeat } from "./ArcBeat";
import { Glyph } from "./ArcLeverage";
import { WORKSTREAM_GLYPH } from "./ArcProofCase";

/**
 * ArcProofStory — Loop's projects as ONE section, the build-up to the
 * configuration (owner, 2026-10-12, after augustus.com: "instead of trying to
 * wrap it into cards, we just leave the right side for visuals. On the left
 * side, we can have the title, a bit of an explanation, and, in concise
 * bullet points with some icons, the specific achievements").
 *
 *   left   sticky: the workstream, the project's line, its lede, and its four
 *          claims as short lines, each with its glyph; a dash per project
 *          under them, the one in view lit. The words change as the visual
 *          they belong to reaches the middle of the screen.
 *   right  the four projects' own visuals, one after the other, each the
 *          proof card's field in a hairline frame; it scrolls, the words stay.
 *
 * No card housing: the job cards that follow are the proof; this is the way
 * there. Below 960px the words sit above their own visual, nothing sticks.
 *
 * ⚠ SET BY `layout: "story"` ON THE PAGE. Pandora reads the same
 * `LOOP_PROOF_CARDS` and keeps the four folder cards.
 */
export function ArcProofStory({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"proof-card">;
  motion?: ArcMotion;
}) {
  const def = getCase(PROOF_STACK_CASE);
  if (!def) throw new Error(`[arc proof-story] case "${PROOF_STACK_CASE}" is not in CASES`);
  const beats = (section.story ?? []).map((b) => {
    const track = def.casefile.tracks.find((t) => t.id === b.track);
    if (!track) {
      throw new Error(
        `[arc proof-story] track "${b.track}" is not on the ${PROOF_STACK_CASE} casefile`
      );
    }
    return { ...b, track };
  });
  const client = proofStackClient();
  const accent = client.accentRgb
    ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties)
    : undefined;

  const [at, setAt] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.lpsI));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    for (const el of panels.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ArcBeat
      id={section.id}
      kind="proof-card"
      className="arc-section arc-sec arc-sec--proof-story"
      ariaLabel={section.ariaLabel ?? "Loop Earplugs, the way there"}
      motion={motion}
    >
      <div className="arc-band arc-lps">
        <div className="arc-lps__words">
          <div className="arc-lps__stick">
            <div className="arc-lps__stack">
              {beats.map((b, i) => (
                <Words key={b.id} beat={b} on={i === at} n={i} />
              ))}
            </div>
            <ol className="arc-lps__dashes" aria-hidden="true">
              {beats.map((b, i) => (
                <li key={b.id} data-on={i === at ? "" : undefined} />
              ))}
            </ol>
          </div>
        </div>
        <div className="arc-lps__visuals">
          {beats.map((b, i) => (
            <div
              key={b.id}
              id={b.id}
              className="arc-lps__panel"
              data-lps-i={i}
              ref={(el) => {
                panels.current[i] = el;
              }}
            >
              {/* the phone's words, above their own visual */}
              <Words beat={b} on n={i} flow />
              <div className="arc-lps__fig">
                <div className="pf-stack" style={accent}>
                  <div className="pf-slot">
                    <ProofCard track={b.track} client={client} panel="field" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ArcBeat>
  );
}

function Words({
  beat,
  on,
  n,
  flow = false,
}: {
  beat: {
    id: string;
    title?: string;
    workstream: string;
    track: CaseTrack;
    retitle?: Readonly<Record<string, string>>;
  };
  on: boolean;
  n: number;
  flow?: boolean;
}) {
  const { track } = beat;
  const title = beat.title ?? track.arc?.title ?? track.project;
  const glyph = WORKSTREAM_GLYPH[beat.workstream.toLowerCase()] ?? "meter";
  const blocks = track.blocks ?? [];
  for (const key of Object.keys(beat.retitle ?? {})) {
    if (!blocks.some((c) => c.title === key)) {
      throw new Error(`[arc proof-story] "${beat.id}" retitles "${key}", which is no claim`);
    }
  }
  return (
    <div
      className={flow ? "arc-lps__text arc-lps__text--flow" : "arc-lps__text"}
      data-on={on ? "" : undefined}
      aria-hidden={flow || on ? undefined : true}
      style={{ "--lps-n": n } as CSSProperties}
    >
      <p className="arc-lps__ws">
        <Glyph kind={glyph} />
        {beat.workstream}
      </p>
      <h2 className="arc-lps__title">{title}</h2>
      {track.card?.lede ? <p className="arc-lps__lede">{track.card.lede}</p> : null}
      <ul className="arc-lps__claims">
        {blocks.map((c) => (
          <li key={c.title}>
            <span className="arc-lps__icon" aria-hidden="true">
              {c.glyph ? <ProofGlyph name={c.glyph} /> : null}
            </span>
            {beat.retitle?.[c.title] ?? c.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

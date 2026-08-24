"use client";

import { useRef } from "react";

import { FilmsPlate } from "@/components/landing/home-v2/services/casefile/FilmsPlate";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { LOOP_ATL_FILMS } from "@/lib/cases/content/loop-earplugs";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcStudioFilmsProps {
  section: ArcSectionOf<"films">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcStudioFilms — the above-the-line reel at page scale (ADR-078).
 *
 * The casefile's own films plate: one film large in the console, the other a
 * rail click away, both playing in the shared lightbox. It replaced a `media`
 * beat that showed ONE film and carried no `menuLabel`, so a full viewport of
 * the page's most striking evidence had no name in the readout and no row in
 * the drawer — a reader could only reach it by scrolling past it.
 *
 * THE SECOND FILM IS THE POINT. A single world-first reads as a one-off; two
 * masters at the same craft bar read as a capability. The record already held
 * both (`LOOP_ATL_FILMS`) and the rail is what makes the second one visible
 * without spending a second viewport on it.
 *
 * ONE RECORD, SHARED BY REFERENCE with the casefile row. The content module
 * contributes a masthead and nothing else.
 *
 * ⚠ NO `<video>` UNTIL A CLICK — the plate's own law, inherited intact: the
 * frame is a poster, the element is created by the lightbox and destroyed
 * with it. On a flowing page that matters more than on the casefile, because
 * nothing here tears the element down on a fold.
 *
 * ⚠ `useCloseOnCasefileFold` NO-OPS HERE, and that is by construction rather
 * than by luck: it looks for `.services-stage[data-proof-live]`, which no arc
 * writes, so it returns without observing. The lightbox's own Escape, its
 * backdrop click and its scroll lock are what close it — the same set the
 * dossier walkthrough has used since ADR-072.
 *
 * The console's arrival gate is declared in arcs.css; ⚠ `data-proof-settled`
 * is never declared on this host (it is half the map console's wheel gate).
 */
export function ArcStudioFilms({ section, index, motion = "reveal" }: ArcStudioFilmsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <ArcBeat
      id={section.id}
      kind="films"
      className="arc-section arc-sec arc-sec--films"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <ArcSectionHead
          head={section.head}
          kind="films"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        {/* An APERTURE (ADR-072): no travel on the wrapper, or it becomes the
            containing block the lightbox portal exists to escape. */}
        <div className="arc-films arc-reveal" ref={rootRef} {...rung(motion, 0.12, 0)}>
          <FilmsPlate films={LOOP_ATL_FILMS} />
        </div>
      </div>
    </ArcBeat>
  );
}

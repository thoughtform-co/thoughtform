"use client";

import Image from "next/image";

import { IntelligenceMapPlate } from "@/components/landing/home-v2/services/casefile/IntelligenceMapPlate";
import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { SheetsPlate } from "@/components/landing/home-v2/services/casefile/SheetsPlate";
import { TOOL_WIREFRAMES } from "@/components/landing/home-v2/services/casefile/wireframes/toolWireframes";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseTrackVisual } from "@/lib/cases/types";

/**
 * ProofField — the record's own visual, at card scale (ADR-094, U1–U3).
 *
 * Four kinds, one law: the field shows what the project PRODUCED, drawn
 * from the same record the casefile and the portfolio arc draw from —
 * never a re-typed copy and never a stock picture.
 *
 *   sheets           the studio's THREE sheets on the field's rail (U3) —
 *                    the ads, the rule the studio drew for when AI may make
 *                    an image, and the limit it refuses to cross. The
 *                    casefile's own `SheetsPlate`, with its rail portalled
 *                    into the card's slot, so all three surfaces letter one
 *                    record and this one inherits the console's tokens
 *   films            the two above-the-line films as stills, ONE AT A TIME
 *                    on that rail, in their 4:5 SOCIAL cut where one exists
 *                    (U2) — and the frame is a BUTTON that plays the master
 *                    (U3), which is the homepage films plate's own grammar
 *   tools            the four AUTHORED wireframes (`TOOL_WIREFRAMES`), the
 *                    drawn record of the tools, ONE AT A TIME — no capture,
 *                    no duotone (ADR-068 U3) — over a watch bar carrying the
 *                    tool's screen-recorded walkthrough (U3)
 *   intelligence-map the PDA console — three readings, forty-seven Skills —
 *                    as a PICTURE of the record: the card's CSS puts a
 *                    transparent layer over it so the console's own wheel
 *                    capture cannot freeze the page inside a sticky stack,
 *                    and its rail is portalled out to `railHost` so the
 *                    readings stay reachable from above that layer
 *
 * ⚠ ONE AT A TIME IS THE POINT (owner, 2026-09-10). Both films side by side
 * were stamps, and four wireframes in one box stacked 1×4 at the owner's
 * portrait field — the drawings are authored for LANDSCAPE bays (W/H 2.3–2.9)
 * and a quarter of a tall panel is not one. Selected, each gets the whole
 * field at the shape it was drawn for.
 *
 * ⚠ THE VIDEO IS THE RECORD'S, AND NONE OF IT IS NEW (U3, owner: "we should
 * have a video walkthrough of all these software"). The four tool
 * walkthroughs are `ProjectCase.walkthrough` — the same files the homepage
 * plays — and the films are `CaseFilm.src`, the 16:9 masters. The lightbox is
 * `MediaLightbox`, which PORTALS to `document.body`: mandatory here, because
 * this card lives inside a `position: sticky` slot and a clipped or
 * transformed ancestor becomes the containing block even for `fixed`.
 *
 * The sizing contract these plates read with no fallback (`--fl-mono`,
 * `--fl-copy`, `--fl-shot-px`, a definite height, the settled gate) is
 * declared on `.tl-card__field` in `trinny-london.css`. ⚠ Since ADR-094 U2
 * the SIZE CONTAINER is one level down, on `.tl-card__bay` — the field now
 * holds the rail as well, and a drawing sized against a box that includes
 * its own chrome is a drawing that never fills the box it is drawn in.
 */
export function ProofField({
  visual,
  idx,
  railHost,
}: {
  visual: CaseTrackVisual;
  /** Which station the head's rail has open. Ignored by the one-object kinds. */
  idx: number;
  /** Where the map's console portals its own rail. */
  railHost: HTMLElement | null;
}) {
  /* ⚠ ONE HOOK FOR THE WHOLE FIELD, above the switch — a hook inside a
     branch is a hook that unmounts when the rail moves. It costs nothing on
     the kinds that never open it. */
  const { watching, open, close } = useWalkthrough();

  switch (visual.kind) {
    case "sheets":
      /* ⚠ THE CASEFILE'S OWN PLATE, WHOLE — frame, state and all — with its
         rail portalled into the card's slot (U3). Two reasons it is the
         plate rather than its contents:

         ONE, the console brings the tokens. `.fl-cmp` and `.fl-caps--sheet`
         read `--con-hair`, `--con-hair2`, `--fl-chrome-*`, `--fl-display`,
         `--fl-ink-dim` and `--fl-plate-px`, which are declared on `.fl-case`
         and `.fl-con` — and RE-DERIVED for light on those same selectors
         (theme.css). A route-local copy of the dark values would have
         rendered dark-tuned line work on a page that is locked to light,
         which is ADR-058's own trap.

         TWO, `SheetsPlate` knows which sheet is open, the way `PdaConsole`
         knows which reading is. A `railHost` is one additive prop; a
         controlled index here would be a second source for one piece of
         state, and `proofTabs` returns `null` for this kind for exactly
         that reason. */
      return (
        <div className="tl-field tl-field--sheets">
          <SheetsPlate
            sheets={visual.sheets}
            stillSizes="(min-width: 1600px) 220px, 18vw"
            railHost={railHost}
          />
        </div>
      );
    case "films": {
      const film = visual.films[Math.min(idx, visual.films.length - 1)];
      if (!film) return null;
      /* ⚠ THE PORTRAIT CUT WINS WHERE THERE IS ONE (ADR-094 U2, owner
         2026-09-10: "I found the vertical versions of our ATLs, I think
         those will work better than the landscape ones"). This field is
         TALL — 693×926 at the owner's viewport — and a 16:9 frame in it is
         a stamp with a third of the box empty either side. `CaseFilm.portrait`
         is the film's own 4:5 social resize, one frame, and it is optional:
         a film without one keeps its landscape poster and the box keeps its
         16/9 derivation. The class is what tells the CSS which. */
      const shot = film.portrait;
      return (
        <div className="tl-field tl-field--films">
          <div className={shot ? "tl-film tl-film--portrait" : "tl-film"}>
            {/* ⚠ THE FRAME IS THE BUTTON, which is the homepage films
                plate's grammar exactly (`.fl-film` is a `<button>` with a
                cue). A film's own frame is the one control it needs; a
                labelled bar beside it would be a second affordance for one
                object. The MASTER plays — the still is the 4:5 social cut
                because this box is tall, but the lightbox is not. */}
            <button
              type="button"
              className="tl-film__frame"
              aria-label={`Play ${film.label}`}
              onClick={(e) => open(e.currentTarget)}
            >
              <Image
                src={shot ? shot.src : film.poster}
                alt={shot ? shot.alt : film.label}
                width={shot?.width ?? 1920}
                height={shot?.height ?? 1080}
                sizes="(min-width: 961px) 56vw, 90vw"
              />
              <i className="tl-film__cue" aria-hidden="true" />
            </button>
            {/* ⚠ THE META SWAPS WITH THE PICTURE. `film.meta` describes the
                16:9 master; under a 4:5 still it names the wrong shape for
                the thing right above it. */}
            <span className="tl-film__caption">
              <span>{film.label}</span>
              <span>{shot ? shot.meta : film.meta}</span>
            </span>
          </div>
          {watching ? (
            <MediaLightbox src={film.src} label={film.label} meta={film.meta} onClose={close} />
          ) : null}
        </div>
      );
    }
    case "tools": {
      const id = visual.toolIds[Math.min(idx, visual.toolIds.length - 1)];
      const Wireframe = id ? TOOL_WIREFRAMES[id] : undefined;
      const tool = PROJECT_CASES.find((c) => c.id === id);
      const walk = tool?.walkthrough;
      return (
        <div className="tl-field tl-field--tools">
          {/* ⚠ THE KEY IS THE REMOUNT, and it is deliberate (ADR-068 U3):
              each drawing seats itself once, so switching tools must give
              the next one a fresh mount rather than swapping props under a
              seated one. The drawing itself is decorative — its labels are
              part of the picture — but the panel around it is named by the
              open station, so the hide goes here and not on the box. */}
          {Wireframe ? (
            <div className="tl-wire" key={id} aria-hidden="true">
              <Wireframe />
            </div>
          ) : null}
          {/* ⚠ A DRAWING IS NOT A VIDEO, so this one takes a LABELLED bar
              where the film takes its own frame. Same reason the homepage's
              tools plate fuses a watch bar to its bay and its films plate
              does not: the control has to say what it opens. */}
          {walk ? (
            <button type="button" className="tl-watch" onClick={(e) => open(e.currentTarget)}>
              <i className="tl-watch__cue" aria-hidden="true" />
              <span className="tl-watch__label">Watch walkthrough</span>
              <span className="tl-watch__meta">{walk.duration}</span>
            </button>
          ) : null}
          {watching && walk && tool ? (
            <MediaLightbox
              src={walk.src}
              label={tool.tab}
              meta={`Walkthrough · ${walk.duration}`}
              onClose={close}
            />
          ) : null}
        </div>
      );
    }
    case "intelligence-map":
      return (
        <div className="tl-field tl-field--map">
          <IntelligenceMapPlate
            shapes={visual.shapes}
            districts={visual.districts}
            works={visual.works}
            skills={visual.skills}
            envelope={visual.envelope}
            railHost={railHost}
          />
        </div>
      );
    default:
      return null;
  }
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";

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
 *                    into the card's slot and its verdict into the card's
 *                    FOOT slot (ADR-097 U10), so all three surfaces letter
 *                    one record and this one inherits the console's tokens
 *   films            the two above-the-line films as stills, ONE AT A TIME
 *                    on that rail, in their 4:5 SOCIAL cut where one exists
 *                    (U2) — and the frame is a BUTTON that plays the master
 *                    (U3), which is the homepage films plate's own grammar
 *   tools            the four AUTHORED wireframes (`TOOL_WIREFRAMES`), the
 *                    drawn record of the tools, ONE AT A TIME — no capture,
 *                    no duotone (ADR-068 U3) — alone in a closed frame, with
 *                    the tool's screen-recorded walkthrough as the panel's
 *                    FOOT button (U3, re-seated at ADR-097 U10)
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
 * declared on `.pf-card__field` in `trinny-london.css`. ⚠ Since ADR-094 U2
 * the SIZE CONTAINER is one level down, on `.pf-card__bay` — the field now
 * holds the rail as well, and a drawing sized against a box that includes
 * its own chrome is a drawing that never fills the box it is drawn in.
 */
export function ProofField({
  visual,
  idx,
  railHost,
  footHost,
}: {
  visual: CaseTrackVisual;
  /** Which station the head's rail has open. Ignored by the one-object kinds. */
  idx: number;
  /** Where the map's console portals its own rail. */
  railHost: HTMLElement | null;
  /** Where a kind portals its FOOT frame — the studio's verdict, the tools'
   *  walkthrough button (ADR-097 U10). `null` until the card's slot exists,
   *  and both kinds render their block in place until then. */
  footHost: HTMLElement | null;
}) {
  /* ⚠ BOTH HOOKS LIVE ABOVE THE SWITCH — a hook inside a branch is a hook
     that unmounts when the rail moves. They cost nothing on the kinds that
     never use them. */
  const { watching, open, close } = useWalkthrough();
  /** Which 4:5 cut is playing IN ITS FRAME, by src (U4). */
  const [playing, setPlaying] = useState<string | null>(null);

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
        <div className="pf-field pf-field--sheets">
          <SheetsPlate
            sheets={visual.sheets}
            stillSizes="(min-width: 1600px) 220px, 18vw"
            railHost={railHost}
            verdictHost={footHost}
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
      const cut = film.portrait;
      /* ⚠ KEYED ON THE FILM'S OWN `src`, NOT A BOOLEAN. Switching stations
         while one plays has to give the next film its still back; a boolean
         would carry "playing" across the swap and mount the next one already
         running — a second film starting that nobody asked for. */
      const live = !!cut && playing === cut.src;
      return (
        <div className="pf-field pf-field--films">
          <div className={cut ? "pf-film pf-film--portrait" : "pf-film"}>
            {live && cut ? (
              /* ⚠ IT PLAYS IN THE FRAME (U4, owner: "when you click on the
                 video thumbnail, it shows the full-screen video. I don't
                 want that"). A 4:5 cut is authored FOR a small vertical
                 frame — this one — so the full-screen takeover was the
                 mismatch. The 16:9 master keeps the lightbox on the surfaces
                 that show it, and the tools keep theirs because a screen
                 recording of a UI is unreadable at card scale.
                 ⚠ STILL NO `<video>` UNTIL A CLICK (ADR-056 U5) — a mounted
                 element costs a layer and this card sits four deep in a
                 sticky stack. `autoPlay` is safe precisely because the mount
                 IS the click. */
              <video
                className="pf-film__frame pf-film__frame--live"
                src={cut.src}
                poster={cut.poster.src}
                controls
                autoPlay
                playsInline
                onEnded={() => setPlaying(null)}
              />
            ) : (
              /* ⚠ THE FRAME IS THE BUTTON, which is the homepage films
                 plate's grammar exactly (`.fl-film` is a `<button>` with a
                 cue). A film's own frame is the one control it needs; a
                 labelled bar beside it would be a second affordance for one
                 object. */
              <button
                type="button"
                className="pf-film__frame"
                aria-label={`Play ${film.label}`}
                onClick={(e) => (cut ? setPlaying(cut.src) : open(e.currentTarget))}
              >
                <Image
                  src={cut ? cut.poster.src : film.poster}
                  alt={cut ? cut.poster.alt : film.label}
                  width={cut?.poster.width ?? 1920}
                  height={cut?.poster.height ?? 1080}
                  sizes="(min-width: 961px) 56vw, 90vw"
                />
                <i className="pf-film__cue" aria-hidden="true" />
              </button>
            )}
            {/* ⚠ THE META SWAPS WITH THE PICTURE. `film.meta` describes the
                16:9 master; under a 4:5 still it names the wrong shape for
                the thing right above it. */}
            <span className="pf-film__caption">
              <span>{film.label}</span>
              <span>{cut ? cut.meta : film.meta}</span>
            </span>
          </div>
          {/* Dormant while both Loop films carry a cut, and kept for the one
              that does not: its master is 16:9, and a landscape frame in
              this tall box is too small to read. */}
          {watching && !cut ? (
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
      /* ⚠ A DRAWING IS NOT A VIDEO, so this one takes a LABELLED control
         where the film takes its own frame: the control has to say what it
         opens. Since ADR-097 U10 it is the panel's FOOT frame — the
         Starfield JUMP grammar: one bar the width of the panel, the label
         centred, the duration in a chip at the end — and it is built once
         here so the two seats below render the same node. */
      const watch = walk ? (
        <button type="button" className="pf-watch" onClick={(e) => open(e.currentTarget)}>
          <span className="pf-watch__act">
            <i className="pf-watch__cue" aria-hidden="true" />
            <span className="pf-watch__label">Watch walkthrough</span>
          </span>
          <span className="pf-watch__meta">{walk.duration}</span>
        </button>
      ) : null;
      return (
        <div className="pf-field pf-field--tools">
          {/* ⚠ THE HEAD IS GONE (U10, owner: "we need to remove that — that
              also gives us some extra real estate"). U8's `IN SERVICE {year}`
              micro-label was the apparatus's head row; the box is the
              drawing's alone now. `ProjectCase.year` stays in the record and
              on the homepage bay's FEED line. */}
          {/* ⚠ THE KEY IS THE REMOUNT, and it is deliberate (ADR-068 U3):
              each drawing seats itself once, so switching tools must give
              the next one a fresh mount rather than swapping props under a
              seated one. The drawing itself is decorative — its labels are
              part of the picture — but the panel around it is named by the
              open station, so the hide goes here and not on the box. */}
          {Wireframe ? (
            <div className="pf-wire" key={id} aria-hidden="true">
              <Wireframe />
            </div>
          ) : null}
          {/* ⚠ THE BUTTON IS THE PANEL'S FOOT FRAME (U10), portalled out of
              the drawing's box into the card's slot — the same seam the rail
              rides. Rendered IN PLACE until the host exists (the server, the
              first client render), which is what keeps the server HTML and
              hydration in step and a no-JS reader with a button; the host
              is set from a ref callback in the layout phase, so it moves
              before the first paint. `open(e.currentTarget)` still captures
              the button for the lightbox's focus return — React events
              bubble through the React tree, portal or not. */}
          {footHost && watch ? createPortal(watch, footHost) : watch}
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
        <div className="pf-field pf-field--map">
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

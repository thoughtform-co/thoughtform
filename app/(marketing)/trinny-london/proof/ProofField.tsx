import Image from "next/image";

import { IntelligenceMapPlate } from "@/components/landing/home-v2/services/casefile/IntelligenceMapPlate";
import { TOOL_WIREFRAMES } from "@/components/landing/home-v2/services/casefile/wireframes/toolWireframes";
import type { CaseTrackVisual } from "@/lib/cases/types";

/**
 * ProofField — the record's own visual, at card scale (ADR-094, U1).
 *
 * Four kinds, one law: the field shows what the project PRODUCED, drawn
 * from the same record the casefile and the portfolio arc draw from —
 * never a re-typed copy and never a stock picture.
 *
 *   sheets           the six Loop ads (the ADS sheet's shots), in NATURAL
 *                    COLOUR and shown WHOLE at 4:5 — the ADR-056 U5 law; the
 *                    duotone is a UI-capture recipe, never a content one
 *   films            the two above-the-line films as stills, ONE AT A TIME on
 *                    the field's own rail, in their 4:5 SOCIAL cut where one
 *                    exists (ADR-094 U2) — still-first, so no `<video>` on a
 *                    card nobody clicks (ADR-056 U5)
 *   tools            the four AUTHORED wireframes (`TOOL_WIREFRAMES`), the
 *                    drawn record of the tools, ONE AT A TIME — no capture,
 *                    no duotone (ADR-068 U3); a tool without a drawing
 *                    draws nothing
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
  switch (visual.kind) {
    case "sheets": {
      const ads = visual.sheets.find((s) => s.body.kind === "stills");
      const shots = ads && ads.body.kind === "stills" ? ads.body.shots : [];
      return (
        <ul className="tl-field tl-field--stills">
          {shots.map((shot) => (
            <li className="tl-still" key={shot.src}>
              <Image
                src={shot.src}
                alt={shot.alt}
                width={shot.width ?? 1080}
                height={shot.height ?? 1350}
                sizes="(min-width: 1600px) 320px, (min-width: 961px) 24vw, 45vw"
              />
            </li>
          ))}
        </ul>
      );
    }
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
            <span className="tl-film__frame">
              <Image
                src={shot ? shot.src : film.poster}
                alt={shot ? shot.alt : film.label}
                width={shot?.width ?? 1920}
                height={shot?.height ?? 1080}
                sizes="(min-width: 961px) 56vw, 90vw"
              />
            </span>
            {/* ⚠ THE META SWAPS WITH THE PICTURE. `film.meta` describes the
                16:9 master; under a 4:5 still it names the wrong shape for
                the thing right above it. */}
            <span className="tl-film__caption">
              <span>{film.label}</span>
              <span>{shot ? shot.meta : film.meta}</span>
            </span>
          </div>
        </div>
      );
    }
    case "tools": {
      const id = visual.toolIds[Math.min(idx, visual.toolIds.length - 1)];
      const Wireframe = id ? TOOL_WIREFRAMES[id] : undefined;
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

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
 *   films            the two above-the-line posters, ONE AT A TIME on the
 *                    head's rail, poster-first (no `<video>` on a card
 *                    nobody clicks — ADR-056 U5)
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
 * declared on `.tl-card__field` in `trinny-london.css`.
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
      return (
        <div className="tl-field tl-field--films">
          <div className="tl-film">
            <span className="tl-film__frame">
              {/* The posters are the films' own 1920×1080 frames
                  (`public/arcs/posters/`); `CaseFilm.poster` is the path. */}
              <Image
                src={film.poster}
                alt={film.label}
                width={1920}
                height={1080}
                sizes="(min-width: 961px) 56vw, 90vw"
              />
            </span>
            <span className="tl-film__caption">
              <span>{film.label}</span>
              <span>{film.meta}</span>
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

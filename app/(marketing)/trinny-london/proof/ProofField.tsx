import Image from "next/image";

import { IntelligenceMapPlate } from "@/components/landing/home-v2/services/casefile/IntelligenceMapPlate";
import { TOOL_WIREFRAMES } from "@/components/landing/home-v2/services/casefile/wireframes/toolWireframes";
import type { CaseTrackVisual } from "@/lib/cases/types";

/**
 * ProofField — the record's own visual, at card scale (ADR-094).
 *
 * Four kinds, one law: the field shows what the project PRODUCED, drawn
 * from the same record the casefile and the portfolio arc draw from —
 * never a re-typed copy and never a stock picture.
 *
 *   sheets           the six Loop ads (the ADS sheet's shots), in NATURAL
 *                    COLOUR and shown WHOLE at 4:5 — the ADR-056 U5 law; the
 *                    duotone is a UI-capture recipe, never a content one
 *   films            the two above-the-line posters, poster-first (no
 *                    `<video>` on a card nobody clicks — ADR-056 U5)
 *   tools            the four AUTHORED wireframes (`TOOL_WIREFRAMES`), the
 *                    drawn record of the tools — no capture, no duotone
 *                    (ADR-068 U3); a tool without a drawing draws nothing
 *   intelligence-map the PDA console — three readings, forty-seven Skills —
 *                    as a PICTURE of the record: the card's CSS puts a
 *                    transparent layer over it so the console's own wheel
 *                    capture cannot freeze the page inside a sticky stack
 *
 * The sizing contract these plates read with no fallback (`--fl-mono`,
 * `--fl-copy`, `--fl-shot-px`, a definite height, the settled gate) is
 * declared on `.tl-card__field` in `trinny-london.css`.
 */
export function ProofField({ visual }: { visual: CaseTrackVisual }) {
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
    case "films":
      return (
        <ul className="tl-field tl-field--films">
          {visual.films.map((film) => (
            <li className="tl-film" key={film.src}>
              <span className="tl-film__frame">
                {/* The posters are the films' own 1920×1080 frames
                    (`public/arcs/posters/`); `CaseFilm.poster` is the path. */}
                <Image
                  src={film.poster}
                  alt={film.label}
                  width={1920}
                  height={1080}
                  sizes="(min-width: 961px) 32vw, 90vw"
                />
              </span>
              <span className="tl-film__caption">
                <span>{film.label}</span>
                <span>{film.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      );
    case "tools":
      return (
        <ul className="tl-field tl-field--tools" aria-hidden="true">
          {visual.toolIds.map((id) => {
            const Wireframe = TOOL_WIREFRAMES[id];
            return (
              <li className="tl-wire" key={id}>
                {Wireframe ? <Wireframe /> : null}
              </li>
            );
          })}
        </ul>
      );
    case "intelligence-map":
      return (
        <div className="tl-field tl-field--map">
          <IntelligenceMapPlate
            shapes={visual.shapes}
            districts={visual.districts}
            works={visual.works}
            skills={visual.skills}
            envelope={visual.envelope}
          />
        </div>
      );
    default:
      return null;
  }
}
